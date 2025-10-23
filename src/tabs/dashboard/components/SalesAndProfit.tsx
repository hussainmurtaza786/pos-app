'use client';
import React, { useEffect, useMemo } from 'react';
import { Box, Flex, Heading, Text, Grid, Icon as ChakraIcon, VStack } from '@chakra-ui/react';
import { FaCalculator, FaDollarSign } from 'react-icons/fa';
import { BiTrendingUp } from 'react-icons/bi';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { getOrders } from '@/redux/slices/app/orderApiThunk';
import { getInventories } from '@/redux/slices/app/inventoryApiThunks';
import { getReturns } from '@/redux/slices/app/returnApiThunk';
import { getExpenses } from '@/redux/slices/app/expenseApiThunk'; // ⬅️ NEW
import type {
  Order as AppOrder,
  ProductInOrder as AppProductInOrder,
  Inventory as AppInventory,
  ReturnOrder,
} from '@/prisma/customTypes';
import type { ReturnOrderProduct as AppReturnOrderProduct } from '@prisma/client';
import { LuReceiptText, LuRotateCcw } from 'react-icons/lu';
import { color } from '@/components/Dialog';

/* ---------------- helpers ---------------- */

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
const toDate = (d: Date | string) => (d instanceof Date ? d : new Date(d));
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/* ---------------- Card ---------------- */

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}> = ({ title, value, icon, color }) => {
  return (
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
};

/* ---------------- KPI calculation (Completed orders only, WAC COGS) ---------------- */

function useSalesProfitFromCompleted(orders: AppOrder[], inventories: AppInventory[]) {
  const today = startOfToday();
  const now = new Date();

  // WAC per productId
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
    year: { sales: 0, profit: 0 },
  };

  for (const o of orders || []) {
    // 🚫 Skip anything not COMPLETED
    const status = String((o as any).status || '').toLowerCase();
    if (status !== 'completed') continue;

    const d = toDate((o as any).createdAt);
    const { netSales, profit } = sumOrder(o);

    if (isSameDay(d, today)) {
      bucket.today.sales += netSales;
      bucket.today.profit += profit;
    }
    if (isSameMonth(d, now)) {
      bucket.month.sales += netSales;
      bucket.month.profit += profit;
    }
    if (d.getFullYear() === now.getFullYear()) {
      bucket.year.sales += netSales;
      bucket.year.profit += profit;
    }
  }

  return { bucket, wacByProduct };
}

const SalesAndProfit: React.FC = () => {
  const dispatch = useAppDispatch();

  const orders = useAppSelector((s) => (s.app.order?.items as AppOrder[]) ?? []);
  const inventories = useAppSelector((s) => (s.app.inventory?.items as AppInventory[]) ?? []);
  const returns = useAppSelector((s) => (s.app.return?.items as ReturnOrder[]) ?? []);
  const expenses = useAppSelector((s) => s.app.expenses?.items ?? []); // ⬅️ NEW

  useEffect(() => {
    if (!orders.length) dispatch(getOrders({ pageNumber: 1, pageSize: 1000 } as any));
    if (!inventories.length) dispatch(getInventories({ pageNumber: 1, pageSize: 1000 } as any));
    if (!returns.length) dispatch(getReturns({ pageNumber: 1, pageSize: 1000 } as any));
    if (!expenses?.length) dispatch(getExpenses({ pageNumber: 1, pageSize: 1000 } as any)); // ⬅️ NEW
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Completed orders only
  const { bucket: gross, wacByProduct } = useSalesProfitFromCompleted(orders, inventories);

  // Returns (cash + return "profit" using WAC)
  const {
    todaysReturns,
    monthlyReturns,
    yearlyReturns,
    todaysReturnProfit,
    monthlyReturnProfit,
    yearlyReturnProfit,
  } = useMemo(() => {
    const today = startOfToday();
    const now = new Date();

    let cashT = 0,
      cashM = 0,
      cashY = 0;
    let profT = 0,
      profM = 0,
      profY = 0;

    for (const r of returns || []) {
      const d = toDate((r as any).createdAt);
      const cash = Number((r as any).returnAmount || 0);

      // estimate "profit given back" using WAC on returned quantities
      const lines = ((r as any).ReturnOrderProduct || []) as AppReturnOrderProduct[];
      const rev = lines.reduce((s, l) => s + Number(l.sellPrice || 0) * Number(l.quantity || 0), 0);
      const cost = lines.reduce((s, l) => {
        const pid = (l as any).productId as string;
        const wac = wacByProduct.get(pid) || 0;
        return s + wac * Number(l.quantity || 0);
      }, 0);
      const retProfit = rev - cost;

      if (isSameDay(d, today)) {
        cashT += cash;
        profT += retProfit;
      }
      if (isSameMonth(d, now)) {
        cashM += cash;
        profM += retProfit;
      }
      if (d.getFullYear() === now.getFullYear()) {
        cashY += cash;
        profY += retProfit;
      }
    }

    return {
      todaysReturns: cashT,
      monthlyReturns: cashM,
      yearlyReturns: cashY,
      todaysReturnProfit: profT,
      monthlyReturnProfit: profM,
      yearlyReturnProfit: profY,
    };
  }, [returns, wacByProduct]);

  // Totals after subtracting returns
  const TodayTotalSales = Math.max(0, gross.today.sales - todaysReturns);
  const MonthlyTotalSales = Math.max(0, gross.month.sales - monthlyReturns);
  const YearlyTotalSales = Math.max(0, gross.year.sales - yearlyReturns);

  const TodayTotalProfit = Math.max(0, gross.today.profit - todaysReturnProfit);
  const MonthlyTotalProfit = Math.max(0, gross.month.profit - monthlyReturnProfit);
  const YearlyTotalProfit = Math.max(0, gross.year.profit - yearlyReturnProfit);

  /* ---------------- Expenses KPI (today / month / year) ---------------- */
  const { todayExp, monthExp, yearExp } = useMemo(() => {
    const today = startOfToday();
    const now = new Date();
    let t = 0,
      m = 0,
      y = 0;

    for (const e of expenses || []) {
      const d = toDate((e as any).createdAt);
      const amt = Number((e as any).amount || 0);
      if (isSameDay(d, today)) t += amt;
      if (isSameMonth(d, now)) m += amt;
      if (d.getFullYear() === now.getFullYear()) y += amt;
    }

    return { todayExp: t, monthExp: m, yearExp: y };
  }, [expenses]);

  return (
    <>

      {/* ===== Existing Sales/Profit/Returns/expenses/Total grids ===== */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6} w="full">
        <VStack w="full" align="stretch" gap={4}>
          <Text fontWeight="bold" textAlign="center" fontSize="30px">
            Today's
          </Text>
          <StatCard title="Today's Sales" value={gross.today.sales} icon={FaDollarSign} color="blue.600" />
          <StatCard title="Today's Profit" value={gross.today.profit} icon={BiTrendingUp} color="green.600" />
          <StatCard title="Today's Returned Sales (Cash)" value={todaysReturns} icon={LuRotateCcw} color="red.600" />
          <StatCard title="Today's Total Sales" value={TodayTotalSales} icon={FaCalculator} color="purple.600" />
          <StatCard title="Today's Total Profit" value={TodayTotalProfit} icon={FaCalculator} color="orange.600" />
           <StatCard title="Today's Expenses"  value={todayExp} icon={LuReceiptText} color="pink.600" />
        </VStack>

        <VStack w="full" align="stretch" gap={4}>
          <Text fontWeight="bold" textAlign="center" fontSize="30px">
            Monthly
          </Text>
          <StatCard title="Monthly Sales" value={gross.month.sales} icon={FaDollarSign} color="blue.600" />
          <StatCard title="Monthly Profit" value={gross.month.profit} icon={BiTrendingUp} color="green.600" />
          <StatCard title="Monthly Returned Sales (Cash)" value={monthlyReturns} icon={LuRotateCcw} color="red.600" />
          <StatCard title="Monthly Total Sales" value={MonthlyTotalSales} icon={FaCalculator} color="purple.600" />
          <StatCard title="Monthly Total Profit" value={MonthlyTotalProfit} icon={FaCalculator} color="orange.600" />
          <StatCard title="Monthly Expenses" value={monthExp} icon={LuReceiptText} color="pink.600" />

        </VStack>

        <VStack w="full" align="stretch" gap={4}>
          <Text fontWeight="bold" textAlign="center" fontSize="30px">
            Yearly
          </Text>
          <StatCard title="Yearly Sales" value={gross.year.sales} icon={FaDollarSign} color="blue.600" />
          <StatCard title="Yearly Profit" value={gross.year.profit} icon={BiTrendingUp} color="green.600" />
          <StatCard title="Yearly Returned Sales (Cash)" value={yearlyReturns} icon={LuRotateCcw} color="red.600" />
          <StatCard title="Yearly Total Sales" value={YearlyTotalSales} icon={FaCalculator} color="purple.600" />
          <StatCard title="Yearly Total Profit" value={YearlyTotalProfit} icon={FaCalculator} color="orange.600" />
          <StatCard title="Yearly Expenses"  value={yearExp} icon={LuReceiptText} color="pink.600" />

        </VStack>
      </Grid>
    </>
  );
};

export default SalesAndProfit;
