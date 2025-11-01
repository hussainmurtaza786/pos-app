'use client';

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Input,
  Button,
  HStack,
  IconButton,
  Flex,
  Textarea,
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
} from "recharts";
import { formatCurrency } from "../../helper";
import { BiDownload, BiEdit, BiPlus, BiX, BiSearch } from "react-icons/bi";
import { BsTrash2, BsFiletypePdf } from "react-icons/bs";

const DataTable = dynamic(() => import("@/components/Table").then(m => m.default), { ssr: false });

type ExpenseRow = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string; // ISO
};

const API_BASE = "/api/expenses";

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}
function shortLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const Expenses: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const openAdd = () => setIsAddOpen(true);
  const closeAdd = () => { setIsAddOpen(false); setEditId(null); setAmount(""); setReason(""); };

  useEffect(() => { void fetchExpenses(); }, []);

  async function fetchExpenses() {
    try {
      const res = await fetch(`${API_BASE}?pageNumber=1&pageSize=500`, { credentials: "include" });
      const json = await res.json();
      const rows: ExpenseRow[] = (json?.data?.items || []).map((e: any) => ({
  id: e.id,
  amount: Number(e.amount) || 0,
  // accept reason OR title from API; default to empty string
  reason: e.reason ?? e.title ?? "",
  createdAt: e.createdAt ?? new Date().toISOString(),
}));
setExpenses(rows);

    } catch (e) {
      console.error("Failed to load expenses", e);
    }
  }

  async function saveExpense() {
    const payload = { amount: Number(amount), reason: reason.trim() };
    if (!payload.amount || !payload.reason) {
      // silently ignore invalid submission
      console.warn("Amount and reason are required.");
      return;
    }
    try {
      if (editId) {
        await fetch(API_BASE, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: editId, ...payload }),
        });
      } else {
        await fetch(API_BASE, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }
      await fetchExpenses();
      closeAdd();
    } catch (e) {
      console.error("Failed to save expense", e);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    try {
      await fetch(`${API_BASE}?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      await fetchExpenses();
    } catch (e) {
      console.error("Failed to delete expense", e);
    }
  }

  function handleEdit(row: ExpenseRow) {
    setEditId(row.id);
    setAmount(String(row.amount));
    setReason(row.reason);
    setIsAddOpen(true);
  }

  function handleExportCSV() {
    const csv = ["Amount,Reason,Date"];
    filteredExpenses.forEach((e) => {
      csv.push(`${e.amount},"${e.reason.replace(/"/g, '""')}",${e.createdAt.slice(0, 10)}`);
    });
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
  }

  async function handleExportPDF() {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("Expenses", 14, 16);
      doc.setFontSize(10);
      let y = 24;
      filteredExpenses.forEach((e, i) => {
        doc.text(
          `${i + 1}. ${formatCurrency(e.amount)} | ${e.reason} | ${e.createdAt.slice(0, 10)}`,
          14,
          y
        );
        y += 6;
        if (y > 280) { doc.addPage(); y = 20; }
      });
      doc.save("expenses.pdf");
    } catch (e) {
      console.warn("PDF export needs jsPDF (npm i jspdf)", e);
    }
  }

const filteredExpenses = useMemo(() => {
  const q = (search || "").trim().toLowerCase();
  if (!q) return expenses;
  return expenses.filter((e) => (e.reason ?? "").toLowerCase().includes(q));
}, [expenses, search]);

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const chartData = useMemo(() => {
    const days = 30;
    const today = new Date();
    const sumsByDay = new Map<string, number>();
    filteredExpenses.forEach((e) => {
      const key = (e.createdAt || "").slice(0, 10);
      if (!key) return;
      sumsByDay.set(key, (sumsByDay.get(key) || 0) + e.amount);
    });
    const arr: { label: string; value: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = toYMD(d);
      arr.push({
        label: shortLabel(d),
        value: sumsByDay.get(key) || 0,
      });
    }
    return arr;
  }, [filteredExpenses]);

  const columns = useMemo(
    () => [
      {
        accessKey: "amount",
        label: "Amount",
        align: "left" as const,
        minWidth: 120,
        format: (n: number) => formatCurrency(n),
      },
      { accessKey: "reason", label: "Reason", minWidth: 260 },
      {
        accessKey: "createdAt",
        label: "Date",
        minWidth: 120,
        format: (iso: string) => (iso ? iso.slice(0, 10) : ""),
      },
      {
        accessKey: "id",
        label: "Actions",
        align: "center" as const,
        minWidth: 110,
        format: (_: any, row: ExpenseRow) => (
          <HStack>
            <IconButton
              aria-label="Edit"
              size="sm"
              variant="solid"
              color="blue"
              onClick={() => handleEdit(row)}
            >
              <BiEdit size={16} />
            </IconButton>
            <IconButton
              aria-label="Delete"
              size="sm"
              variant="outline"
              color="red"
              onClick={() => handleDelete(row.id)}
            >
              <BsTrash2 size={16} />
            </IconButton>
          </HStack>
        ),
      },
    ],
    [filteredExpenses]
  );

  return (
    <Box p={6}>
      <Flex align="center" justify="space-between">
        <Heading size="lg" color="gray.800">Expense Manager</Heading>
        <HStack>
          <Button bgColor="teal" color="white" width="80px" onClick={handleExportCSV}>
            CSV <BiDownload size={18} />
          </Button>
          <Button bgColor="red" color="white" width="80px" onClick={handleExportPDF}>
            PDF <BsFiletypePdf size={18} />
          </Button>
        </HStack>
      </Flex>

      <Flex align="center" justify="space-between" mt={4}>
        <Box border="2px solid" borderColor="gray.300" rounded="xl" position="relative" w={{ base: "100%", md: "520px" }}>
          <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="gray.400">
            <BiSearch size={18} />
          </Box>
          <Input
            pl="40px"
            height="46px"
            borderColor="gray.300"
            _focus={{ borderColor: "blue.400", rounded: "xl", boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" }}
            placeholder="Search reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>

        <Button bgColor="blue" color="white" width="150px" height="46px" onClick={openAdd}>
          Add Expense <BiPlus size={18} />
        </Button>
      </Flex>

      <Box bg="white" p={4} rounded="xl" shadow="sm" mt={4} border="1px solid" borderColor="gray.200">
        <Text fontWeight="semibold" color="gray.800" mb={2}>Expense History</Text>
        <DataTable
          columns={columns as any}
          rows={filteredExpenses}
          emptyRowMsg={<Text color="gray.500">No expenses found.</Text>}
          tableContainerProps={{ borderRadius: "md" }}
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
              <YAxis
                width={80}
                tickFormatter={(v) => `Rs ${Number(v).toLocaleString()}`}
              />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v))}
                labelFormatter={(l) => `Date: ${l}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name="Daily Expenses"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {isAddOpen && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          backdropFilter="blur(2px)"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          px={4}
        >
          <Box
            bg="white"
            rounded="2xl"
            w="full"
            maxW="740px"
            p={{ base: 5, md: 7 }}
            boxShadow="xl"
            position="relative"
          >
            <IconButton
              aria-label="Close"
              position="absolute"
              top={3}
              right={3}
              size="sm"
              variant="ghost"
              onClick={closeAdd}
            >
              <BiX color="gray" size={18} />
            </IconButton>

            <Heading size="md" mb={4}>
              {editId ? "Update Expense" : "Add New Expense"}
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Box>
                <Text mb={2} fontWeight="medium">Amount *</Text>
                <Input
                  type="number"
                  padding="5px"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  height="44px"
                  border="1px solid"
                  borderColor="gray.300"
                  rounded="md"
                />
              </Box>

              <Box gridColumn={{ base: "span 1", md: "span 2" }}>
                <Text mb={2} fontWeight="medium">Reason *</Text>
                <Textarea
                  placeholder="Describe the expense"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  resize="vertical"
                  minH="90px"
                  border="1px solid"
                  borderColor="gray.300"
                  rounded="md"
                />
              </Box>
            </SimpleGrid>

            <Flex mt={6} justify="flex-end" gap={3}>
              <Button variant="ghost" color="gray" onClick={closeAdd}>Cancel</Button>
              <Button color="blue" onClick={saveExpense}>
                {editId ? "Update Expense" : "Add Expense"}
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Expenses;
