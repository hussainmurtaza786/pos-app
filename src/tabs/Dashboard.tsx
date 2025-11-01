'use client';

import React, { useEffect, useMemo } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Stack,
  Icon as ChakraIcon,
  Container,
} from '@chakra-ui/react';
import { BiShoppingBag, BiTrendingUp, BiUserPlus } from 'react-icons/bi';
import { FaDollarSign } from 'react-icons/fa';
import { FiAlertTriangle } from 'react-icons/fi';

/* -----------------------------
   Helpers
------------------------------ */

const formatCurrency = (amount: number) =>
  `Rs ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/* -----------------------------
   Types that match your API slices
------------------------------ */
type Status = 'Pending' | 'Completed';

type ProductInOrder = {
  productId: string;
  inventoryId?: string | null;
  quantity: number;
  sellPrice: number;
};

type Order = {
  id: number;
  description?: string | null;
  discount: number;
  amountReceived: number;
  status?: Status | null;
  createdAt: string; // ISO
  ProductInOrder: ProductInOrder[];
};

type Inventory = {
  id: string;
  productId: string;
  availableQuantity: number;
  purchasePrice: number; // COGS per unit
};

type ReturnOrderProduct = {
  productId: string;
  quantity: number;
  sellPrice: number;
};
type ReturnOrder = {
  id: number;
  createdAt: string; // ISO
  ReturnOrderProduct: ReturnOrderProduct[];
};

/* -----------------------------
   Redux
------------------------------ */
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { getOrders } from '@/redux/slices/app/orderApiThunks';
import { getInventories } from '@/redux/slices/app/inventoryApiThunks'; // you already use this on Inventory tab

/* -----------------------------
   UI atoms (no Stat, no StatNumber)
------------------------------ */

const StatCard: React.FC<{
  title: string;
  value: number;
  returns?: number;
  icon: React.ElementType;
  color: string; // e.g. 'blue.600'
}> = ({ title, value, returns = 0, icon, color }) => {
  const netValue = (value || 0) - (returns || 0);
  return (
    <Box
      bg="white"
      p={6}
      rounded="xl"
      shadow="sm"
      borderWidth="1px"
      borderColor="gray.100"
      _hover={{ shadow: 'md' }}
      transition="box-shadow 0.2s ease"
    >
      <Flex align="center" justify="space-between" gap={4}>
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.600">
            {title}
          </Text>
          <Heading as="p" fontSize="2xl" mt={1} color="gray.900">
            {formatCurrency(netValue)}
          </Heading>
          {returns > 0 && (
            <Text fontSize="xs" color="red.600" mt={1}>
              Returns: -{formatCurrency(returns)}
            </Text>
          )}
        </Box>

        <Flex
          w="48px"
          h="48px"
          rounded="lg"
          bg={color}
          color="white"
          align="center"
          justify="center"
          flexShrink={0}
        >
          <ChakraIcon as={icon} boxSize={6} />
        </Flex>
      </Flex>
    </Box>
  );
};

/* -----------------------------
   KPI math using Orders + Inventory (COGS)
------------------------------ */

function useKpis(orders: Order[], inventories: Inventory[], returns: ReturnOrder[]) {
  const today = startOfToday();
  const now = new Date();

  // Map inventoryId -> purchasePrice for quick COGS lookup
  const invPriceById = useMemo(() => {
    const m = new Map<string, number>();
    for (const inv of inventories || []) {
      if (inv?.id) m.set(inv.id, Number(inv.purchasePrice || 0));
    }
    return m;
  }, [inventories]);

  // helpers per-order
  const orderLineTotals = (o: Order) =>
    o.ProductInOrder.reduce(
      (acc, l) => {
        const lineRevenue = Number(l.sellPrice || 0) * Number(l.quantity || 0);
        const unitCost =
          (l.inventoryId && invPriceById.get(l.inventoryId)) || 0;
        const lineCost = unitCost * Number(l.quantity || 0);
        return {
          revenue: acc.revenue + lineRevenue,
          cost: acc.cost + lineCost,
        };
      },
      { revenue: 0, cost: 0 }
    );

  const returnsAmountByRange = (range: 'today' | 'month' | 'year') => {
    let amt = 0;
    for (const r of returns || []) {
      const d = new Date(r.createdAt);
      const within =
        range === 'today'
          ? isSameDay(d, today)
          : range === 'month'
          ? isSameMonth(d, now)
          : d.getFullYear() === now.getFullYear();
      if (!within) continue;
      const value = r.ReturnOrderProduct.reduce(
        (s, l) => s + Number(l.sellPrice || 0) * Number(l.quantity || 0),
        0
      );
      amt += value;
    }
    return amt;
  };

  const base = {
    today: { sales: 0, cost: 0, profit: 0, tx: 0 },
    month: { sales: 0, cost: 0, profit: 0, tx: 0 },
    year: { sales: 0, cost: 0, profit: 0, tx: 0 },
  };

  for (const o of orders || []) {
    const d = new Date(o.createdAt);
    const { revenue, cost } = orderLineTotals(o);
    const netSales = revenue - Number(o.discount || 0);
    const profit = netSales - cost;

    const apply = (bucket: keyof typeof base) => {
      base[bucket].sales += netSales;
      base[bucket].cost += cost;
      base[bucket].profit += profit;
      base[bucket].tx += 1;
    };

    if (isSameDay(d, today)) apply('today');
    if (isSameMonth(d, now)) apply('month');
    if (d.getFullYear() === now.getFullYear()) apply('year');
  }

  // Returns revenue impact
  const todaysReturns = returnsAmountByRange('today');
  const monthlyReturns = returnsAmountByRange('month');
  const yearlyReturns = returnsAmountByRange('year');

  // Returns profit impact: estimate using monthly margin if we lack return COGS
  const monthlyMargin =
    base.month.sales > 0 ? base.month.profit / base.month.sales : 0;
  const todaysReturnsProfit = todaysReturns * monthlyMargin;
  const monthlyReturnsProfit = monthlyReturns * monthlyMargin;
  const yearlyReturnsProfit = yearlyReturns * (base.year.sales > 0 ? base.year.profit / base.year.sales : monthlyMargin);

  return {
    todaysSales: base.today.sales,
    todaysProfit: base.today.profit,
    monthlySales: base.month.sales,
    monthlyProfit: base.month.profit,
    yearlySales: base.year.sales,
    yearlyProfit: base.year.profit,
    totalTransactions: base.month.tx,
    avgTransaction: base.month.tx ? base.month.sales / base.month.tx : 0,
    todaysReturns,
    monthlyReturns,
    yearlyReturns,
    todaysReturnsProfit,
    monthlyReturnsProfit,
    yearlyReturnsProfit,
  };
}

/* -----------------------------
   Page
------------------------------ */

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();

  // pull from your existing slices
  const ordersState = useAppSelector((s) => s.app.orders);
  const inventoriesState = useAppSelector((s) => s.app.inventory);
  // If you have a returns slice, expose items here; otherwise stays empty.
  const maybeReturnsState = useAppSelector((s) => (s as any).app?.returns ?? (s as any).app?.returnOrders);

  const orders: Order[] = ordersState?.items ?? [];
  const inventories: Inventory[] = inventoriesState?.items ?? [];
  const returns: ReturnOrder[] = (maybeReturnsState?.items as ReturnOrder[]) ?? [];

  // fetch if empty
  useEffect(() => {
    // Load a big enough page to cover the current month and some history
    if (!orders?.length) {
      dispatch(getOrders({ pageNumber: 1, pageSize: 1000 } as any));
    }
    if (!inventories?.length) {
      dispatch(getInventories({ pageNumber: 1, pageSize: 1000 } as any));
    }
    // For returns: uncomment when you share the thunk name
    // if (!returns?.length) dispatch(getReturnOrders({ pageNumber: 1, pageSize: 1000 }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(
    () => useKpis(orders, inventories, returns),
    [orders, inventories, returns]
  );

  return (
    <Container maxW="7xl" py={{ base: 4, lg: 6 }}>
      <Stack >
        {/* Header */}
        <Box>
          <Heading as="h1" fontSize={{ base: 'xl', lg: '2xl' }} color="gray.900">
            Sales Dashboard
          </Heading>
          <Text color="gray.600">
            Track your sales performance and profits (net of returns)
          </Text>
        </Box>

        {/* Stat Cards */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={{ base: 4, lg: 6 }}>
          <StatCard
            title="Today's Sales"
            value={stats.todaysSales}
            returns={stats.todaysReturns}
            icon={FaDollarSign}
            color="blue.600"
          />
          <StatCard
            title="Today's Profit"
            value={stats.todaysProfit}
            returns={stats.todaysReturnsProfit}
            icon={BiTrendingUp}
            color="green.600"
          />
          <StatCard
            title="Monthly Sales"
            value={stats.monthlySales}
            returns={stats.monthlyReturns}
            icon={BiShoppingBag}
            color="purple.600"
          />
          <StatCard
            title="Monthly Profit"
            value={stats.monthlyProfit}
            returns={stats.monthlyReturnsProfit}
            icon={BiTrendingUp}
            color="green.600"
          />
          <StatCard
            title="Yearly Sales"
            value={stats.yearlySales}
            returns={stats.yearlyReturns}
            icon={BiShoppingBag}
            color="orange.600"
          />
          <StatCard
            title="Yearly Profit"
            value={stats.yearlyProfit}
            returns={stats.yearlyReturnsProfit}
            icon={BiTrendingUp}
            color="green.600"
          />
          <StatCard
            title="Total Transactions"
            value={stats.totalTransactions}
            icon={BiUserPlus}
            color="blue.600"
          />
          <StatCard
            title="Average Transaction"
            value={stats.avgTransaction}
            icon={FaDollarSign}
            color="blue.600"
          />
        </SimpleGrid>

        {/* Quick Overview (Net of Returns) */}
        <Box
          bg="white"
          p={6}
          rounded="xl"
          shadow="sm"
          borderWidth="1px"
          borderColor="gray.100"
        >
          <Heading as="h3" fontSize={{ base: 'md', lg: 'lg' }} mb={4} color="gray.900">
            Quick Overview (Net of Returns)
          </Heading>

          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={{ base: 4, lg: 6 }}>
            <Box textAlign="center">
              <Heading as="p" fontSize={{ base: '2xl', lg: '3xl' }} color="blue.600">
                {formatCurrency(stats.todaysSales - stats.todaysReturns)}
              </Heading>
              <Text color="gray.600" mt={1}>
                Today&apos;s Net Sales
              </Text>
            </Box>

            <Box textAlign="center">
              <Heading as="p" fontSize={{ base: '2xl', lg: '3xl' }} color="green.600">
                {formatCurrency(stats.todaysProfit - stats.todaysReturnsProfit)}
              </Heading>
              <Text color="gray.600" mt={1}>
                Today&apos;s Net Profit
              </Text>
            </Box>

            <Box textAlign="center">
              <Heading as="p" fontSize={{ base: '2xl', lg: '3xl' }} color="purple.600">
                {Number(stats.totalTransactions || 0).toLocaleString()}
              </Heading>
              <Text color="gray.600" mt={1}>
                Total Transactions
              </Text>
            </Box>

            <Box textAlign="center">
              <Heading as="p" fontSize={{ base: '2xl', lg: '3xl' }} color="orange.600">
                {formatCurrency(stats.avgTransaction)}
              </Heading>
              <Text color="gray.600" mt={1}>
                Avg Transaction (Net)
              </Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Returns Impact */}
        <Box bg="red.50" borderWidth="1px" borderColor="red.200" p={6} rounded="xl">
          <Flex align="start" gap={3}>
            <ChakraIcon as={FiAlertTriangle} boxSize={6} color="red.600" mt="1" />
            <Box flex="1">
              <Heading as="h3" fontSize="lg" color="red.800" mb={2}>
                Returns Impact
              </Heading>

              <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4}>
                <Box textAlign="center">
                  <Heading as="p" fontSize={{ base: 'xl', lg: '2xl' }} color="red.600">
                    {formatCurrency(stats.todaysReturns)}
                  </Heading>
                  <Text color="red.700">Today&apos;s Returns</Text>
                </Box>
                <Box textAlign="center">
                  <Heading as="p" fontSize={{ base: 'xl', lg: '2xl' }} color="red.600">
                    {formatCurrency(stats.monthlyReturns)}
                  </Heading>
                  <Text color="red.700">Monthly Returns</Text>
                </Box>
                <Box textAlign="center">
                  <Heading as="p" fontSize={{ base: 'xl', lg: '2xl' }} color="red.600">
                    {formatCurrency(stats.yearlyReturns)}
                  </Heading>
                  <Text color="red.700">Yearly Returns</Text>
                </Box>
              </SimpleGrid>
            </Box>
          </Flex>
        </Box>
      </Stack>
    </Container>
  );
};

export default Dashboard;
