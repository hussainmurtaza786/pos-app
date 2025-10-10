'use client';
import React, { useEffect, useMemo } from 'react';
import { Box, Flex, Heading, Text, Grid, Icon as ChakraIcon, VStack } from '@chakra-ui/react';
import { FaCalculator, FaDollarSign } from 'react-icons/fa';
import { BiTrendingDown, BiTrendingUp } from 'react-icons/bi';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { getOrders } from '@/redux/slices/app/orderApiThunk';
import { getInventories } from '@/redux/slices/app/inventoryApiThunks';
import { getReturns } from '@/redux/slices/app/returnApiThunk';
import type {
  Order as AppOrder,
  ProductInOrder as AppProductInOrder,
  Inventory as AppInventory,
  ReturnOrder,
} from '@/prisma/customTypes';

const formatCurrency = (amount: number) =>
  `Rs ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const toDate = (d: Date | string) => (d instanceof Date ? d : new Date(d));
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth();

/* --- Card --- */
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}> = ({ title, value, icon, color }) => (
  <Box
    w="full"
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
          {formatCurrency(value)}
        </Heading>
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

/* --- Compute gross sales & profit from orders (WAC COGS) --- */
function useSalesProfitGross(orders: AppOrder[], inventories: AppInventory[]) {
  const today = startOfToday();
  const now = new Date();

  // WAC per product
  const wacByProduct = useMemo(() => {
    const totals = new Map<string, { qty: number; value: number }>();
    for (const inv of inventories || []) {
      const pid = (inv as any).productId as string;
      const qty = Number((inv as any).purchasedQuantity || 0);
      const price = Number((inv as any).purchasePrice || 0);
      if (!pid || qty <= 0) continue;
      const t = totals.get(pid) || { qty: 0, value: 0 };
      t.qty += qty;
      t.value += qty * price;
      totals.set(pid, t);
    }
    const map = new Map<string, number>();
    totals.forEach((t, pid) => map.set(pid, t.qty > 0 ? t.value / t.qty : 0));
    return map;
  }, [inventories]);

  const sumOrder = (o: AppOrder) => {
    const lines = (o.ProductInOrder || []) as AppProductInOrder[];
    const revenue = lines.reduce((s, l) => s + Number(l.sellPrice || 0) * Number(l.quantity || 0), 0);
    const cost = lines.reduce((s, l) => {
      const pid = (l as any).productId as string;
      const wac = wacByProduct.get(pid) || 0;
      return s + wac * Number(l.quantity || 0);
    }, 0);
    const discount = Number((o as any).discount || 0);
    const netSales = revenue - discount;
    const profit = netSales - cost;
    return { netSales, profit };
  };

  const bucket = {
    today: { sales: 0, profit: 0 },
    month: { sales: 0, profit: 0 },
    year:  { sales: 0, profit: 0 },
  };

  for (const o of orders || []) {
    const d = toDate((o as any).createdAt);
    const { netSales, profit } = sumOrder(o);

    if (isSameDay(d, today)) { bucket.today.sales += netSales; bucket.today.profit += profit; }
    if (isSameMonth(d, now)) { bucket.month.sales += netSales; bucket.month.profit += profit; }
    if (d.getFullYear() === now.getFullYear()) { bucket.year.sales += netSales; bucket.year.profit += profit; }
  }

  return { bucket, wacByProduct };
}

const SalesAndProfit: React.FC = () => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector((s) => (s.app.order?.items as AppOrder[]) ?? []);
  const inventories = useAppSelector((s) => (s.app.inventory?.items as AppInventory[]) ?? []);
  const returns = useAppSelector((s) => (s.app.return?.items as ReturnOrder[]) ?? []);

  useEffect(() => {
    if (!orders.length)      dispatch(getOrders({ pageNumber: 1, pageSize: 1000 } as any));
    if (!inventories.length) dispatch(getInventories({ pageNumber: 1, pageSize: 1000 } as any));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!returns.length) {
      dispatch(getReturns({ pageNumber: 1, pageSize: 1000 } as any));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { bucket: gross, wacByProduct } = useSalesProfitGross(orders, inventories);

  // Returned SALES (cash) for totals, as before
  const { todaysReturns, monthlyReturns, yearlyReturns } = useMemo(() => {
    const today = startOfToday();
    const now = new Date();
    let t = 0, m = 0, y = 0;
    for (const r of returns) {
      const d = toDate((r as any).createdAt);
      const amount = Number((r as any).returnAmount || 0);  // cash returned
      if (isSameDay(d, today)) t += amount;
      if (isSameMonth(d, now)) m += amount;
      if (d.getFullYear() === now.getFullYear()) y += amount;
    }
    return { todaysReturns: t, monthlyReturns: m, yearlyReturns: y };
  }, [returns]);

  // Returned PROFIT (computed from return lines: (sellPrice - WAC) * qty)
  const { retProfitToday, retProfitMonth, retProfitYear } = useMemo(() => {
    const today = startOfToday();
    const now = new Date();
    let pT = 0, pM = 0, pY = 0;

    for (const r of returns || []) {
      const d = toDate((r as any).createdAt);
      const lines = ((r as any).ReturnOrderProduct || []) as Array<{ productId: string; sellPrice: number; quantity: number }>;
      const profit = lines.reduce((acc, l) => {
        const wac = wacByProduct.get(l.productId) || 0;
        const lineProfit = (Number(l.sellPrice || 0) - wac) * Number(l.quantity || 0);
        return acc + lineProfit;
      }, 0);

      if (isSameDay(d, today)) pT += profit;
      if (isSameMonth(d, now)) pM += profit;
      if (d.getFullYear() === now.getFullYear()) pY += profit;
    }
    return { retProfitToday: pT, retProfitMonth: pM, retProfitYear: pY };
  }, [returns, wacByProduct]);

  // Totals
  const TodayTotalSales   = gross.today.sales   ? gross.today.sales   - todaysReturns  : 0;
  const MonthlyTotalSales = gross.month.sales   ? gross.month.sales   - monthlyReturns : 0;
  const YearlyTotalSales  = gross.year.sales    ? gross.year.sales    - yearlyReturns  : 0;

  const TodayTotalProfit   = gross.today.profit - retProfitToday;
  const MonthlyTotalProfit = gross.month.profit - retProfitMonth;
  const YearlyTotalProfit  = gross.year.profit  - retProfitYear;

  return (
    <Grid
      templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
      gap={6}
      w="full"
    >
      {/* Today */}
      <VStack w="full" align="stretch" gap={4}>
        <Text fontWeight="bold" textAlign="center" fontSize="30px">Today's</Text>
        <StatCard title="Today's Sales" value={gross.today.sales} icon={FaDollarSign} color="blue.600" />
        <StatCard title="Today's Profit" value={gross.today.profit} icon={BiTrendingUp} color="green.600" />
        <StatCard title="Today's Returned Sales" value={todaysReturns} icon={BiTrendingDown} color="red.600" />
        <StatCard title="Today's Total Sales" value={TodayTotalSales} icon={FaCalculator} color="purple.600" />
        <StatCard title="Today's Total Profit" value={TodayTotalProfit} icon={FaCalculator} color="teal.600" />
      </VStack>

      {/* Month */}
      <VStack w="full" align="stretch" gap={4}>
        <Text fontWeight="bold" textAlign="center" fontSize="30px">Monthly</Text>
        <StatCard title="Monthly Sales" value={gross.month.sales} icon={FaDollarSign} color="blue.600" />
        <StatCard title="Monthly Profit" value={gross.month.profit} icon={BiTrendingUp} color="green.600" />
        <StatCard title="Monthly Returned Sales" value={monthlyReturns} icon={BiTrendingDown} color="red.600" />
        <StatCard title="Monthly Total Sales" value={MonthlyTotalSales} icon={FaCalculator} color="purple.600" />
        <StatCard title="Monthly Total Profit" value={MonthlyTotalProfit} icon={FaCalculator} color="teal.600" />
      </VStack>

      {/* Year */}
      <VStack w="full" align="stretch" gap={4}>
        <Text fontWeight="bold" textAlign="center" fontSize="30px">Yearly</Text>
        <StatCard title="Yearly Sales" value={gross.year.sales} icon={FaDollarSign} color="blue.600" />
        <StatCard title="Yearly Profit" value={gross.year.profit} icon={BiTrendingUp} color="green.600" />
        <StatCard title="Yearly Returned Sales" value={yearlyReturns} icon={BiTrendingDown} color="red.600" />
        <StatCard title="Yearly Total Sales" value={YearlyTotalSales} icon={FaCalculator} color="purple.600" />
        <StatCard title="Yearly Total Profit" value={YearlyTotalProfit} icon={FaCalculator} color="teal.600" />
      </VStack>
    </Grid>
  );
};

export default SalesAndProfit;
