import { Box, Flex, Heading, IconButton, Input, Text } from "@chakra-ui/react";
import Table from '@/components/Table';
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { IoMdRefresh } from 'react-icons/io';
import { getExpenses } from "@/redux/slices/app/expenseApiThunk";
import { AddUpdateExpenseForm, DeleteExpenseHandlerButton, ViewExpense } from "./components";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "../../../helper";

export default function ExpenseTab() {
  const { count, input, items: expenses } = useAppSelector(s => s.app.expenses);
  const isFetchingExpenses = useAppSelector(s => s.app.fetchingStatus.getExpenses);
  const dispatch = useAppDispatch();


  const [search, setSearch] = useState("");

  // Pagination
  const handlePaginationChange = useCallback(async (pageNumber: number, pageSize: number) => {
    await dispatch(getExpenses({ ...input, pageNumber, pageSize })).unwrap();
  }, [dispatch]); // include `input` if it changes frequently

  // Initial data fetch
  useEffect(() => {
    if (!expenses || !expenses.length) {
      dispatch(getExpenses(input));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side filter
  const filteredRows = useMemo(() => {
    const q = (search || "").toLowerCase();
    if (!q) return expenses || [];
    return (expenses || []).filter(row => {
      // const id = String(row?.id || "").toLowerCase();
      const id = (row?.id || "").toLowerCase();
      const reason = (row?.reason || "").toLowerCase();

      return (
        id.includes(q) ||
        reason.includes(q)
      );
    });
  }, [expenses, search]);

  // make a safe YYYY-MM-DD key in LOCAL time (avoids TZ shifts)
  const toLocalISOKey = (v: unknown): string | null => {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(String(v));
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const chartData = useMemo(() => {
    if (!expenses?.length) return [];

    const totals = new Map<string, number>();

    for (const exp of expenses) {
      const key = toLocalISOKey((exp as any).createdAt);
      if (!key) continue; // skip bad dates
      const amt = Number((exp as any).amount) || 0;
      totals.set(key, (totals.get(key) ?? 0) + amt);
    }

    return [...totals.entries()]
      .sort(([a], [b]) => a.localeCompare(b)) // ascending: 16 -> 17 -> 18 ...
      .map(([iso, value]) => ({
        label: new Date(iso).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        value,
      }));
  }, [expenses]);


  // 💰 Calculate total
  const totalExpense = useMemo(() => {
    return expenses?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;
  }, [expenses]);

  return (
    <Box p={5}>
      <Flex mb={5} w="100%" align="center" justify="space-between">
        <Box>
          <Heading fontFamily="poppins" fontSize="3xl" fontWeight="bold">Expense</Heading>
          <Text>Manage your Expenses</Text>
        </Box>
        <AddUpdateExpenseForm type="Add" />
      </Flex>

      {/* Search like Inventory (no InputGroup/Select) */}
      <Flex mb="3" align="center" gap={3}>
        <Input border="2px solid" px={5} placeholder="Search Expense" value={search} onChange={(e) => setSearch(e.target.value)} borderColor="gray.300" bg="white" />
        <IconButton ml="auto" title="Refresh Data" variant="subtle" onClick={() => dispatch(getExpenses(input))} aria-label="data-refetch-btn">
          <IoMdRefresh />
        </IconButton>
      </Flex>

      <Box bg="white" border="1px solid var(--chakra-colors-gray-200)" borderRadius="xl" boxShadow="sm">
        <Table
          rows={filteredRows}
          onPaginationChange={handlePaginationChange}
          columns={[
            { accessKey: "id", label: "Id", align: "left", format: val => <ViewExpense expenseId={val} /> },
            { accessKey: "amount", label: "sku", align: "left" },
            { accessKey: "reason", label: "Reason", align: "left", },

            {
              accessKey: "id",
              label: "Action",
              align: "left",
              format: (val, rowValues) => (
                <Flex gap={4} align="center">
                  <AddUpdateExpenseForm initialValues={rowValues} type="Update" />
                  <DeleteExpenseHandlerButton expenseId={val} />
                </Flex>
              )
            },
          ]}
          dataFetchingAsync
          loading={isFetchingExpenses}
          totalRows={count}
          pageSize={input.pageSize}
          pageNumber={input.pageNumber}
        />
      </Box>
      <Box bg="white" p={4} rounded="xl" shadow="sm" mt={6} border="1px solid" borderColor="gray.200">
        <Text fontWeight="semibold" mb={2} color="gray.800">Expense Summary</Text>
        <Text fontSize="lg" fontWeight="bold" color="gray.800" mb={4}>
          Total Expenses: {formatCurrency(totalExpense)}
        </Text>
        <Box w="100%" h="340px">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis width={80} tickFormatter={(v) => `Rs ${Number(v).toLocaleString()}`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} labelFormatter={(l) => `Date: ${l}`} />
              <Legend />
              <Line type="monotone" dataKey="value" name="Daily Expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  );
}
