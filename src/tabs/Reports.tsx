'use client';

import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Heading, Text, Input, Button, HStack, VStack, Flex, IconButton, Spacer, Badge
} from "@chakra-ui/react";
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";
import { BiRefresh, BiDownload, BiCalendar } from "react-icons/bi";

import { useAppDispatch, useAppSelector } from "@/redux/store";
import { getOrders } from "@/redux/slices/app/orderApiThunk";
import { getReturns } from "@/redux/slices/app/returnApiThunk";
import { getExpenses } from "@/redux/slices/app/expenseApiThunk";
import { getProductInOrders } from "@/redux/slices/app/productInOrderApiThunk";
import { formatCurrency } from "../../helper";

type OrderRow = {
  id: string;
  createdAt?: string;
  totalAmount?: number;
  total?: number;
  amount?: number;
  grandTotal?: number;
};

type ReturnRow = {
  id: string;
  createdAt?: string;
  returnAmount?: number;
  amount?: number;
};

type ExpenseRow = {
  id: string;
  createdAt?: string;
  amount: number;
};

// helpers
const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const shortLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const n = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmtRs = (v: number) =>
  `Rs ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const monthKey = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" });

// colors to match your screenshots (purple/pink family)
const COLORS = ["#8B5CF6", "#EC4899", "#7C3AED", "#A78BFA", "#F472B6", "#9333EA"];

export default function Reports() {
  const dispatch = useAppDispatch();

  // default last 30 days
  const today = new Date();
  const minus30 = new Date();
  minus30.setDate(today.getDate() - 29);

  const [from, setFrom] = useState(toISODate(minus30));
  const [to, setTo] = useState(toISODate(today));

  // store
  const orderItems = useAppSelector((s: any) => s?.app?.order?.items ?? []);
  const returnItems = useAppSelector((s: any) => s?.app?.return?.items ?? []);
  const expenseItems = useAppSelector((s: any) => s?.app?.expense?.items ?? []);
  const pioItems = useAppSelector((s: any) => s?.app?.productInOrder?.items ?? []);

  const loadingOrders = useAppSelector((s: any) => s?.app?.fetchingStatus?.getOrders ?? false);
  const loadingReturns = useAppSelector((s: any) => s?.app?.fetchingStatus?.getReturns ?? false);
  const loadingExpenses = useAppSelector((s: any) => s?.app?.fetchingStatus?.getExpenses ?? false);
  const loadingPIO = useAppSelector((s: any) => s?.app?.fetchingStatus?.getProductInOrders ?? false);
  const loading = loadingOrders || loadingReturns || loadingExpenses || loadingPIO;

  // initial load
  useEffect(() => {
    dispatch(getOrders({ pageNumber: 1, pageSize: 1000 } as any));
    dispatch(getReturns({ pageNumber: 1, pageSize: 1000 } as any));
    dispatch(getExpenses({ pageNumber: 1, pageSize: 1000 } as any));
    dispatch(getProductInOrders({ pageNumber: 1, pageSize: 2000 } as any));
  }, [dispatch]);

  // normalize to local shapes
  const orders: OrderRow[] = useMemo(
    () =>
      (orderItems as any[]).map((o) => ({
        id: o.id,
        createdAt: o.createdAt ?? null,
        totalAmount: n(o.totalAmount),
        total: n(o.total),
        amount: n(o.amount),
        grandTotal: n(o.grandTotal),
      })),
    [orderItems]
  );

  const returns: ReturnRow[] = useMemo(
    () =>
      (returnItems as any[]).map((r) => ({
        id: r.id,
        createdAt: r.createdAt ?? null,
        returnAmount: n(r.returnAmount),
        amount: n(r.amount),
      })),
    [returnItems]
  );

  const expenses: ExpenseRow[] = useMemo(
    () =>
      (expenseItems as any[]).map((e) => ({
        id: e.id,
        createdAt: e.createdAt ?? null,
        amount: n(e.amount),
      })),
    [expenseItems]
  );

  // map: orderId -> createdAt (for filtering PIO by order date)
  const orderDateById = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of orderItems as any[]) {
      if (o?.id && o?.createdAt) m.set(o.id, o.createdAt);
    }
    return m;
  }, [orderItems]);

  // date range filter (inclusive)
  const fromDate = useMemo(() => new Date(`${from}T00:00:00`), [from]);
  const toDate = useMemo(() => new Date(`${to}T23:59:59.999`), [to]);

  const inRange = (iso?: string) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d >= fromDate && d <= toDate;
  };

  const ordersInRange = useMemo(() => orders.filter(o => inRange(o.createdAt)), [orders, from, to]);
  const returnsInRange = useMemo(() => returns.filter(r => inRange(r.createdAt)), [returns, from, to]);
  const expensesInRange = useMemo(() => expenses.filter(e => inRange(e.createdAt)), [expenses, from, to]);

  // totals
  const grossSales = useMemo(() => {
    return ordersInRange.reduce((sum, o) => {
      const val = n(o.totalAmount) || n(o.grandTotal) || n(o.total) || n(o.amount);
      return sum + val;
    }, 0);
  }, [ordersInRange]);

  const totalReturns = useMemo(() => {
    return returnsInRange.reduce((sum, r) => sum + (n(r.returnAmount) || n(r.amount)), 0);
  }, [returnsInRange]);

  const totalExpenses = useMemo(() => {
    return expensesInRange.reduce((sum, e) => sum + n(e.amount), 0);
  }, [expensesInRange]);

  const netRevenue = useMemo(() => grossSales - totalReturns - totalExpenses, [grossSales, totalReturns, totalExpenses]);

  // Category Performance (donut)
  // Uses productInOrder rows; expects row.product.category.name, row.quantity, row.sellPrice/price
  const categoryPerformance = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of pioItems as any[]) {
      const orderId = row?.orderId;
      const createdAt = orderId ? orderDateById.get(orderId) : null;
      if (!inRange(createdAt ?? undefined)) continue;

      const qty = n(row?.quantity) || 1;
      const unit = n(row?.sellPrice) || n(row?.price) || n(row?.unitPrice);
      const cat = row?.product?.category?.name || "Uncategorized";
      map.set(cat, (map.get(cat) ?? 0) + qty * unit);
    }
    const arr = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    arr.sort((a, b) => b.value - a.value);
    return arr;
  }, [pioItems, orderDateById, fromDate, toDate]);

  // Sales vs Profit per month (bars)
  // profit proxy = sales - returns - expenses (per month)
  const salesVsProfitMonthly = useMemo(() => {
    const salesByMonth = new Map<string, number>();
    const returnsByMonth = new Map<string, number>();
    const expensesByMonth = new Map<string, number>();

    ordersInRange.forEach(o => {
      const key = monthKey(o.createdAt ?? "");
      const amt = n(o.totalAmount) || n(o.grandTotal) || n(o.total) || n(o.amount);
      salesByMonth.set(key, (salesByMonth.get(key) ?? 0) + amt);
    });
    returnsInRange.forEach(r => {
      const key = monthKey(r.createdAt ?? "");
      const amt = n(r.returnAmount) || n(r.amount);
      returnsByMonth.set(key, (returnsByMonth.get(key) ?? 0) + amt);
    });
    expensesInRange.forEach(e => {
      const key = monthKey(e.createdAt ?? "");
      const amt = n(e.amount);
      expensesByMonth.set(key, (expensesByMonth.get(key) ?? 0) + amt);
    });

    // continuous month rows between from and to
    const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const end = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
    const rows: { month: string; sales: number; profit: number }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const key = monthKey(cur);
      const s = salesByMonth.get(key) ?? 0;
      const ret = returnsByMonth.get(key) ?? 0;
      const exp = expensesByMonth.get(key) ?? 0;
      rows.push({ month: key, sales: s, profit: s - ret - exp });
      cur.setMonth(cur.getMonth() + 1);
    }
    return rows;
  }, [ordersInRange, returnsInRange, expensesInRange, fromDate, toDate]);

  // daily trend
  const chartData = useMemo(() => {
    const map = new Map<string, { sales: number; returns: number; expenses: number }>();

    const add = (key: string, which: "sales" | "returns" | "expenses", val: number) => {
      const row = map.get(key) ?? { sales: 0, returns: 0, expenses: 0 };
      row[which] += val;
      map.set(key, row);
    };

    ordersInRange.forEach(o => {
      const key = (o.createdAt ?? "").slice(0, 10);
      const val = n(o.totalAmount) || n(o.grandTotal) || n(o.total) || n(o.amount);
      if (key) add(key, "sales", val);
    });

    returnsInRange.forEach(r => {
      const key = (r.createdAt ?? "").slice(0, 10);
      const val = n(r.returnAmount) || n(r.amount);
      if (key) add(key, "returns", val);
    });

    expensesInRange.forEach(e => {
      const key = (e.createdAt ?? "").slice(0, 10);
      if (key) add(key, "expenses", n(e.amount));
    });

    // fill full range
    const arr: { label: string; sales: number; returns: number; expenses: number; net: number }[] = [];
    const start = new Date(fromDate);
    const end = new Date(toDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = toISODate(d);
      const row = map.get(key) ?? { sales: 0, returns: 0, expenses: 0 };
      arr.push({
        label: shortLabel(d),
        sales: row.sales,
        returns: row.returns,
        expenses: row.expenses,
        net: row.sales - row.returns - row.expenses,
      });
    }
    return arr;
  }, [ordersInRange, returnsInRange, expensesInRange, fromDate, toDate]);

  // export CSV
  function exportCSV() {
    const lines = [
      "Date,Gross Sales,Returns,Expenses,Net Revenue",
      ...chartData.map(r =>
        [
          r.label,
          r.sales.toFixed(2),
          r.returns.toFixed(2),
          r.expenses.toFixed(2),
          r.net.toFixed(2),
        ].join(",")
      ),
      "",
      `TOTAL,,${grossSales.toFixed(2)},${totalReturns.toFixed(2)},${totalExpenses.toFixed(2)},${netRevenue.toFixed(2)}`
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Box p={6}>
      {/* Header + Filters */}
      <Flex align="center" wrap="wrap" gap={3}>
        <Heading size="lg" color="gray.800">Reports</Heading>
        <Spacer />
        <HStack>
          <HStack>
            <BiCalendar />
            <Input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              height="42px"
            />
          </HStack>
          <HStack>
            <BiCalendar />
            <Input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              height="42px"
            />
          </HStack>
          <IconButton aria-label="Refresh data" onClick={() => {
            dispatch(getOrders({ pageNumber: 1, pageSize: 1000 } as any));
            dispatch(getReturns({ pageNumber: 1, pageSize: 1000 } as any));
            dispatch(getExpenses({ pageNumber: 1, pageSize: 1000 } as any));
            dispatch(getProductInOrders({ pageNumber: 1, pageSize: 2000 } as any));
          }}>
            <BiRefresh />
          </IconButton>
          <Button bgColor="teal" color="white" onClick={exportCSV} disabled={loading}>
            <BiDownload style={{ marginRight: 6 }} /> CSV
          </Button>
        </HStack>
      </Flex>

      {/* KPI cards */}
      <Flex mt={5} gap={4} wrap="wrap">
        <StatCard title="Gross Sales" value={fmtRs(grossSales)} tone="blue" loading={loading} />
        <StatCard title="Returns" value={fmtRs(totalReturns)} tone="orange" loading={loading} />
        <StatCard title="Expenses" value={fmtRs(totalExpenses)} tone="red" loading={loading} />
        <StatCard title="Net Revenue" value={fmtRs(netRevenue)} tone={netRevenue >= 0 ? "green" : "red"} loading={loading} />
      </Flex>

      {/* Daily Trend */}
      <Box bg="white" p={4} rounded="xl" shadow="sm" mt={6} border="1px solid" borderColor="gray.200" w="100%" h="360px">
        <Text fontWeight="semibold" color="gray.800" mb={2}>Daily Trend</Text>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis width={80} tickFormatter={(v) => `Rs ${Number(v).toLocaleString()}`} />
            <Tooltip
              formatter={(v: any) => (formatCurrency ? formatCurrency(Number(v)) : fmtRs(Number(v)))}
              labelFormatter={(l: any) => `Date: ${l}`}
            />
            <Legend />
            <Line type="monotone" dataKey="sales" name="Sales" stroke="#7C3AED" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="returns" name="Returns" stroke="#EC4899" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#8B5CF6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="net" name="Net" stroke="#10B981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* Two-up: Category Performance + Sales vs Profit */}
      <Flex mt={6} gap={4} wrap="wrap">
        {/* Category Performance (Donut) */}
        <Box flex="1 1 380px" minW="320px" bg="white" p={4} rounded="xl" shadow="sm" border="1px solid" borderColor="gray.200">
          <Text fontWeight="semibold" color="gray.800" mb={2}>Category Performance</Text>
          <Box w="100%" h="280px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip formatter={(v: any) => (formatCurrency ? formatCurrency(Number(v)) : fmtRs(Number(v)))} />
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
                <Box w="12px" h="12px" rounded="sm" style={{ background: COLORS[i % COLORS.length] }} />
                <Text fontSize="sm" color="gray.700">{c.name}</Text>
              </HStack>
            ))}
          </HStack>
        </Box>

        {/* Sales vs Profit (Bars, month-by-month) */}
        <Box flex="1 1 520px" minW="360px" bg="white" p={4} rounded="xl" shadow="sm" border="1px solid" borderColor="gray.200">
          <Flex align="center" justify="space-between" mb={2}>
            <Text fontWeight="semibold" color="gray.800">Sales vs Profit</Text>
            <Badge colorScheme="gray">range: {from} → {to}</Badge>
          </Flex>
          <Box w="100%" h="280px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesVsProfitMonthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis width={80} tickFormatter={(v) => `Rs ${Number(v).toLocaleString()}`} />
                <Tooltip
                  formatter={(v: any) => (formatCurrency ? formatCurrency(Number(v)) : fmtRs(Number(v)))}
                  labelFormatter={(l: any) => `Month: ${l}`}
                />
                <Legend />
                <Bar dataKey="sales" name="Sales" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#EC4899" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Flex>

      {/* Recent items lists (no table, no Divider) */}
      <Flex mt={6} gap={4} wrap="wrap">
        <ListCard
          title="Recent Orders"
          items={ordersInRange.slice(0, 10).map(o => ({
            primary: fmtRs(n(o.totalAmount) || n(o.grandTotal) || n(o.total) || n(o.amount)),
            secondary: o.createdAt?.slice(0, 10) || "",
          }))}
          badge="Order"
          tone="blue"
        />
        <ListCard
          title="Recent Returns"
          items={returnsInRange.slice(0, 10).map(r => ({
            primary: fmtRs(n(r.returnAmount) || n(r.amount)),
            secondary: r.createdAt?.slice(0, 10) || "",
          }))}
          badge="Return"
          tone="orange"
        />
        <ListCard
          title="Recent Expenses"
          items={expensesInRange.slice(0, 10).map(e => ({
            primary: fmtRs(n(e.amount)),
            secondary: e.createdAt?.slice(0, 10) || "",
          }))}
          badge="Expense"
          tone="red"
        />
      </Flex>
    </Box>
  );
}

/** Minimal stat card (no FormControl/Table/Divider) */
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
    <Box flex="1 1 240px" bg="white" p={4} rounded="xl" shadow="sm" border="1px solid" borderColor="gray.200">
      <Text fontSize="sm" color="gray.500">{title}</Text>
      <HStack mt={2} align="baseline">
        <Heading size="md" color={colorMap[tone]}>{loading ? "…" : value}</Heading>
      </HStack>
    </Box>
  );
}

/** Simple list card to show recent items */
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
    <Box flex="1 1 320px" bg="white" p={4} rounded="xl" shadow="sm" border="1px solid" borderColor="gray.200" minW="280px">
      <HStack justify="space-between" mb={2}>
        <Text fontWeight="semibold" color="gray.800">{title}</Text>
        <Badge colorScheme={colorMap[tone]}>{badge}</Badge>
      </HStack>
      <VStack align="stretch" gap={2}>
        {items.length === 0 ? (
          <Text color="gray.500">No data.</Text>
        ) : (
          items.map((it, idx) => (
            <Box key={idx} border="1px solid" borderColor="gray.200" rounded="md" p={2}>
              <Text fontWeight="medium">{it.primary}</Text>
              {it.secondary ? <Text color="gray.600" fontSize="sm">{it.secondary}</Text> : null}
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
}
