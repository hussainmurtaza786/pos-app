'use client';

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Input,
  Button,
  HStack,
  VStack,
  Flex,
  IconButton,
  Spacer,
  Badge,
} from "@chakra-ui/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { BiRefresh, BiDownload, BiCalendar } from "react-icons/bi";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { getOrders } from "@/redux/slices/app/orderApiThunk";
import { getReturns } from "@/redux/slices/app/returnApiThunk";
import { getExpenses } from "@/redux/slices/app/expenseApiThunk";

/* ---------------- helpers ---------------- */

// const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const toISODate = (d: Date) => d.toLocaleDateString('en-CA');
// const shortLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
// const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const shortLabel = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const monthKey = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" });
const n = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmtRs = (v: number) =>
  `Rs ${v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// safe local YYYY-MM-DD key from Date|string|unknown
const toLocalISOKey = (v: unknown): string | null => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// compute sales for an order (lines - discount)
const orderSales = (o: any) => {
  const lines = (o?.ProductInOrder ?? []) as any[];
  const revenue = lines.reduce(
    (s, l) => s + (Number(l?.sellPrice) || 0) * (Number(l?.quantity) || 0),
    0
  );
  const discount = Number(o?.discount) || 0;
  return Math.max(0, revenue - discount);
};

// palette similar to your theme/screenshots
const COLORS = ["#8B5CF6", "#EC4899", "#7C3AED", "#A78BFA", "#F472B6", "#9333EA"];

/* ---------------- component ---------------- */

export default function Reports() {
  const dispatch = useAppDispatch();

  // last 30 days default
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 29);

  const [from, setFrom] = useState(toISODate(start));
  const [to, setTo] = useState(toISODate(today));

  // ---- store paths
  const orderItems = useAppSelector((s) => s.app.order.items);
  const returnItems = useAppSelector((s) => s.app.return.items);
  const expenseItems = useAppSelector((s) => s.app.expenses.items);

  const loadingOrders = useAppSelector((s) => s.app.fetchingStatus.getOrders);
  const loadingReturns = useAppSelector((s) => s.app.fetchingStatus.getReturns);
  const loadingExpenses = useAppSelector((s) => s.app.fetchingStatus.getExpenses);
  const loading = loadingOrders || loadingReturns || loadingExpenses;

  // categories (optional fallback for categoryId -> name)
  const categories = useAppSelector((s) => s.app.category.items);
  const categoryNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories ?? []) m.set(c.id, c.name);
    return m;
  }, [categories]);

  // fetch once (large pages; client filters by date)
  useEffect(() => {
    dispatch(getOrders({ pageNumber: 1, pageSize: 1000 } as any));
    dispatch(getReturns({ pageNumber: 1, pageSize: 1000 } as any));
    dispatch(getExpenses({ pageNumber: 1, pageSize: 1000 } as any));
  }, [dispatch]);

  // date-range helpers
  const fromDate = useMemo(() => new Date(`${from}T00:00:00`), [from]);
  const toDate = useMemo(() => new Date(`${to}T23:59:59.999`), [to]);
  const inRange = (createdAt?: string | Date) => {
    if (!createdAt) return false;
    const d = new Date(createdAt);
    return d >= fromDate && d <= toDate;
  };

  // filter by range first
  const ordersInRange = useMemo(
    () => (orderItems as any[]).filter((o) => inRange(o?.createdAt)),
    [orderItems, fromDate, toDate]
  );
  const returnsInRange = useMemo(
    () => (returnItems as any[]).filter((r) => inRange(r?.createdAt)),
    [returnItems, fromDate, toDate]
  );
  const expensesInRange = useMemo(
    () => (expenseItems as any[]).filter((e) => inRange(e?.createdAt)),
    [expenseItems, fromDate, toDate]
  );

  // Completed orders: in-range and all-time
  const completedOrdersInRange = useMemo(
    () => (ordersInRange as any[]).filter((o) => String(o?.status) === "Completed"),
    [ordersInRange]
  );

  const completedOrdersAllTime = useMemo(
    () => (orderItems as any[]).filter((o) => String(o?.status) === "Completed"),
    [orderItems]
  );

  /* ---------- sales math ---------- */

  // All-time Gross Sales KPI (Completed only, no date filter)
  const grossSalesAllTime = useMemo(() => {
    let sum = 0;
    for (const o of completedOrdersAllTime) sum += orderSales(o);
    return sum;
  }, [completedOrdersAllTime]);

  // Range Gross Sales (Completed only) for charts/CSV totals if needed
  const grossSalesInRange = useMemo(() => {
    let sum = 0;
    for (const o of completedOrdersInRange) sum += orderSales(o);
    return sum;
  }, [completedOrdersInRange]);

  // -------- NEW: All-time Returns & Expenses (ignore calendar) --------
  const totalReturnsAllTime = useMemo(
    () =>
      (returnItems as any[]).reduce((s, r: any) => s + (n(r?.returnAmount) || n(r?.amount)),
        0),
    [returnItems]
  );

  const totalExpensesAllTime = useMemo(
    () => (expenseItems as any[]).reduce((s, e: any) => s + n(e?.amount), 0),
    [expenseItems]
  );

  // Keep range versions for charts/CSV
  const totalReturns = useMemo(
    () =>
      returnsInRange.reduce((s: number, r: any) => s + (n(r?.returnAmount) || n(r?.amount)),0),
    [returnsInRange]
  );

  const totalExpenses = useMemo(
    () => expensesInRange.reduce((s: number, e: any) => s + n(e?.amount), 0),
    [expensesInRange]
  );

  // All-time Net Revenue KPI
  const netRevenueAllTime = useMemo(
    () => grossSalesAllTime - totalReturnsAllTime - totalExpensesAllTime,
    [grossSalesAllTime, totalReturnsAllTime, totalExpensesAllTime]
  );

  // Range Net Revenue (used for charts/CSV if needed)
  const netRevenue = useMemo(
    () => grossSalesInRange - totalReturns - totalExpenses,
    [grossSalesInRange, totalReturns, totalExpenses]
  );

  // daily trend (continuous series over [from..to]) using Completed orders
  const dailyTrend = useMemo(() => {
    const map = new Map<string, { sales: number; returns: number; expenses: number }>();
    const add = (
      k: string,
      f: "sales" | "returns" | "expenses",
      v: number
    ) => {
      const row = map.get(k) ?? { sales: 0, returns: 0, expenses: 0 };
      row[f] += v;
      map.set(k, row);
    };

    // sales from Completed orders only (range)
    for (const o of completedOrdersInRange) {
      const key = toLocalISOKey((o as any)?.createdAt);
      if (!key) continue;
      add(key, "sales", orderSales(o));
    }

    // returns/expenses (range)
    for (const r of returnsInRange) {
      const key = toLocalISOKey((r as any)?.createdAt);
      if (!key) continue;
      add(key, "returns", n((r as any)?.returnAmount) || n((r as any)?.amount));
    }
    for (const e of expensesInRange) {
      const key = toLocalISOKey((e as any)?.createdAt);
      if (!key) continue;
      add(key, "expenses", n((e as any)?.amount));
    }

    const rows: {
      label: string;
      sales: number;
      returns: number;
      expenses: number;
      net: number;
    }[] = [];
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const key = toISODate(d);
      const v = map.get(key) ?? { sales: 0, returns: 0, expenses: 0 };
      rows.push({
        label: shortLabel(d),
        sales: v.sales,
        returns: v.returns,
        expenses: v.expenses,
        net: v.sales - v.returns - v.expenses,
      });
    }
    return rows;
  }, [completedOrdersInRange, returnsInRange, expensesInRange, fromDate, toDate]);

  // category performance from Completed order lines (all-time)
  const categoryPerformance = useMemo(() => {
    const buckets = new Map<string, number>();

    for (const o of completedOrdersAllTime) {
      const lines = (o as any)?.ProductInOrder ?? [];
      for (const l of lines) {
        const nestedName = l?.product?.category?.name as string | undefined;
        const catId = l?.product?.categoryId as string | undefined;
        const cat =
          nestedName ??
          (catId ? categoryNameById.get(catId) ?? "Uncategorized" : "Uncategorized");

        const revenue = n(l?.sellPrice) * n(l?.quantity);
        buckets.set(cat, (buckets.get(cat) ?? 0) + revenue);
      }

      const discount = n((o as any)?.discount);
      if (discount > 0 && buckets.size) {
        const [largestName] =
          [...buckets.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
        if (largestName) {
          buckets.set(
            largestName,
            Math.max(0, (buckets.get(largestName) ?? 0) - discount)
          );
        }
      }
    }

    return [...buckets.entries()]
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [completedOrdersAllTime, categoryNameById]); // fixed dependency

  // monthly bars: sales (Completed only) vs profit (range-based)
  const salesVsProfitMonthly = useMemo(() => {
    const salesByMonth = new Map<string, number>();
    const returnsByMonth = new Map<string, number>();
    const expensesByMonth = new Map<string, number>();

    for (const o of completedOrdersAllTime) {
      const key = monthKey((o as any)?.createdAt ?? "");
      salesByMonth.set(key, (salesByMonth.get(key) ?? 0) + orderSales(o));
    }
    for (const r of returnsInRange) {
      const key = monthKey((r as any)?.createdAt ?? "");
      returnsByMonth.set(
        key,
        (returnsByMonth.get(key) ?? 0) +
          (n((r as any)?.returnAmount) || n((r as any)?.amount))
      );
    }
    for (const e of expensesInRange) {
      const key = monthKey((e as any)?.createdAt ?? "");
      expensesByMonth.set(key,(expensesByMonth.get(key) ?? 0) + n((e as any)?.amount));
    }

    const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const end = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
    const rows: { month: string; sales: number; profit: number }[] = [];
    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
      const key = monthKey(d);
      const s = salesByMonth.get(key) ?? 0;
      const ret = returnsByMonth.get(key) ?? 0;
      const exp = expensesByMonth.get(key) ?? 0;
      rows.push({ month: key, sales: s, profit: s - ret - exp });
    }
    return rows;
  }, [completedOrdersAllTime, returnsInRange, expensesInRange, fromDate, toDate]);

  // export CSV for the trend (range totals)
  function exportCSV() {
    const lines = [
      "Date,Gross Sales,Returns,Expenses,Net Revenue",
      ...dailyTrend.map((r) =>
        [r.label, r.sales.toFixed(2), r.returns.toFixed(2), r.expenses.toFixed(2), r.net.toFixed(2)].join(",")
      ),
      "",
      // fixed column count for TOTAL row
      ["TOTAL", grossSalesInRange.toFixed(2), totalReturns.toFixed(2), totalExpenses.toFixed(2), netRevenue.toFixed(2)].join(","),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------------- UI ---------------- */

  return (
    <Box p={6}>
      {/* Header + Filters */}
      <Flex align="center" wrap="wrap" gap={3}>
        <Heading size="lg" color="gray.800">
          Reports
        </Heading>
        <Spacer />
        <HStack>
          <HStack>
            <Text>From</Text>
            <Input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              height="42px"
            />
          </HStack>
          <HStack>
            <Text>To</Text>
            <Input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              height="42px"
            />
          </HStack>
          <IconButton
            aria-label="Refresh data"
            onClick={() => {
              dispatch(getOrders({ pageNumber: 1, pageSize: 1000 } as any));
              dispatch(getReturns({ pageNumber: 1, pageSize: 1000 } as any));
              dispatch(getExpenses({ pageNumber: 1, pageSize: 1000 } as any));
            }}
          >
            <BiRefresh />
          </IconButton>
          <Button
            bgColor="teal"
            padding={6}
            color="white"
            onClick={exportCSV}
            disabled={loading}
          >
            <BiDownload /> CSV
          </Button>
        </HStack>
      </Flex>

      {/* KPIs */}
      <Flex mt={5} gap={4} wrap="wrap">
        <StatCard
          title="Gross Sales (All time, Completed)"
          value={fmtRs(grossSalesAllTime)}
          tone="blue"
          loading={loading}
        />
        <StatCard
          title="Returns (All time)"
          value={fmtRs(totalReturnsAllTime)}
          tone="orange"
          loading={loading}
        />
        <StatCard
          title="Expenses (All time)"
          value={fmtRs(totalExpensesAllTime)}
          tone="red"
          loading={loading}
        />
        <StatCard
          title="Net Revenue (All time)"
          value={fmtRs(netRevenueAllTime)}
          tone={netRevenueAllTime >= 0 ? "green" : "red"}
          loading={loading}
        />
      </Flex>

      {/* Daily Trend */}
      <Box
        bg="white"
        p={4}
        rounded="xl"
        shadow="sm"
        mt={6}
        border="1px solid"
        borderColor="gray.200"
        w="100%"
        h="360px"
      >
        <Text fontWeight="semibold" color="gray.800" mb={2}>
          Daily Trend (Completed sales)
        </Text>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={dailyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis
              width={80}
              tickFormatter={(v) => `Rs ${Number(v).toLocaleString()}`}
            />
            <Tooltip
              formatter={(v: any) => fmtRs(Number(v))}
              labelFormatter={(l: any) => `Date: ${l}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="sales"
              name="Sales"
              stroke="#0048ff"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="returns"
              name="Returns"
              stroke="#fb2a2a"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#EC4899"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="net"
              name="Net"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* Two-up: Category + Sales vs Profit */}
      <Flex mt={6} gap={4} wrap="wrap">
        {/* Category Performance (Donut) */}
        <Box
          flex="1 1 380px"
          minW="320px"
          bg="white"
          p={4}
          rounded="xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontWeight="semibold" color="gray.800" mb={2}>
            Category Performance (Completed sales)
          </Text>
          <Box w="100%" h="280px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip formatter={(v: any) => fmtRs(Number(v))} />
                <Pie
                  data={categoryPerformance}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="transparent"
                >
                  {categoryPerformance.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Box>
          <HStack mt={3} wrap="wrap" gap={3}>
            {categoryPerformance.map((c, i) => (
              <HStack key={c.name}>
                <Box
                  w="12px"
                  h="12px"
                  rounded="sm"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <Text fontSize="sm" color="gray.700">
                  {c.name}
                </Text>
              </HStack>
            ))}
          </HStack>
        </Box>

        {/* Sales vs Profit (Monthly) */}
        <Box
          flex="1 1 520px"
          minW="360px"
          bg="white"
          p={4}
          rounded="xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <Flex align="center" justify="space-between" mb={2}>
            <Text fontWeight="semibold" color="gray.800">
              Sales vs Profit (Completed sales)
            </Text>
            <Badge colorScheme="gray">
              range: {from} → {to}
            </Badge>
          </Flex>
          <Box w="100%" h="280px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesVsProfitMonthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  width={80}
                  tickFormatter={(v) => `Rs ${Number(v).toLocaleString()}`}
                />
                <Tooltip
                  formatter={(v: any) => fmtRs(Number(v))}
                  labelFormatter={(l: any) => `Month: ${l}`}
                />
                <Legend />
                <Bar
                  dataKey="sales"
                  name="Sales"
                  fill="#7C3AED"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="profit"
                  name="Profit"
                  fill="#EC4899"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Flex>

      {/* Recent lists */}
      <Flex mt={6} gap={4} wrap="wrap">
        <ListCard
          title="Recent Orders (Completed)"
          items={completedOrdersInRange.slice(0, 10).map((o) => {
            const sales = orderSales(o);
            return {
              primary: fmtRs(sales),
              secondary: (o as any)?.createdAt?.slice(0, 10) ?? "",
            };
          })}
          badge="Order"
          tone="blue"
        />
        <ListCard
          title="Recent Returns"
          items={returnsInRange.slice(0, 10).map((r) => ({
            primary: fmtRs(n((r as any)?.returnAmount) || n((r as any)?.amount)),
            secondary: (r as any)?.createdAt?.slice(0, 10) ?? "",
          }))}
          badge="Return"
          tone="orange"
        />
        <ListCard
          title="Recent Expenses"
          items={expensesInRange.slice(0, 10).map((e) => ({
            primary: fmtRs(n((e as any)?.amount)),
            secondary: (e as any)?.createdAt?.slice(0, 10) ?? "",
          }))}
          badge="Expense"
          tone="red"
        />
      </Flex>
    </Box>
  );
}

/* ---------------- mini UI bits ---------------- */

function StatCard({
  title,
  value,
  tone = "gray",
  loading,
}: {
  title: string;
  value: string;
  tone?: "blue" | "orange" | "red" | "green" | "gray";
  loading?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: "blue.500",
    orange: "orange.500",
    red: "red.500",
    green: "green.600",
    gray: "gray.600",
  };
  return (
    <Box
      flex="1 1 240px"
      bg="white"
      p={4}
      rounded="xl"
      shadow="sm"
      border="1px solid"
      borderColor="gray.200"
    >
      <Text fontSize="sm" color="gray.500">
        {title}
      </Text>
      <HStack mt={2} align="baseline">
        <Heading size="md" color={colorMap[tone]}>
          {loading ? "…" : value}
        </Heading>
      </HStack>
    </Box>
  );
}

function ListCard({
  title,
  items,
  badge,
  tone,
}: {
  title: string;
  items: { primary: string; secondary?: string }[];
  badge: string;
  tone: "blue" | "orange" | "red";
}) {
  const colorMap: Record<string, string> = {
    blue: "blue",
    orange: "orange",
    red: "red",
  };
  return (
    <Box
      flex="1 1 320px"
      bg="white"
      p={4}
      rounded="xl"
      shadow="sm"
      border="1px solid"
      borderColor="gray.200"
      minW="280px"
    >
      <HStack justify="space-between" mb={2}>
        <Text fontWeight="semibold" color="gray.800">
          {title}
        </Text>
        <Badge colorScheme={colorMap[tone]}>{badge}</Badge>
      </HStack>
      <VStack align="stretch" gap={2}>
        {items.length === 0 ? (
          <Text color="gray.500">No data.</Text>
        ) : (
          items.map((it, idx) => (
            <Box
              key={idx}
              border="1px solid"
              borderColor="gray.200"
              rounded="md"
              p={2}
            >
              <Text fontWeight="medium">{it.primary}</Text>
              {it.secondary ? (
                <Text color="gray.600" fontSize="sm">
                  {it.secondary}
                </Text>
              ) : null}
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
}
