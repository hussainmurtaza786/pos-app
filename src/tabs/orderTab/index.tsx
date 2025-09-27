import { Box, Flex, Heading, Text, IconButton, Spinner, Input } from "@chakra-ui/react";
import Table from '@/components/Table';
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AddUpdateOrderForm, ViewOrder, StatusBadge, ViewReturn, ReturnRow } from "./components";
import { getOrders } from "@/redux/slices/app/orderApiThunk";
import { IoMdRefresh } from "react-icons/io";

/** ------------- Dummy Return History data ------------- */
const DUMMY_RETURNS: ReturnRow[] = [
  {
    id: 101,
    createdAt: new Date().toISOString(),
    description: "Customer changed mind",
    products: [
      { name: "Demo Product A", quantity: 1, sellPrice: 500 },
      { name: "Demo Product C", quantity: 2, sellPrice: 750 },
    ],
  },
  {
    id: 102,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    description: "Damaged packaging",
    products: [{ name: "Demo Product B", quantity: 1, sellPrice: 1200 }],
  },
  {
    id: 103,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    description: "Wrong size",
    products: [{ name: "Demo Product A", quantity: 3, sellPrice: 500 }],
  },
];

export default function Order() {
  const { count, input, items: order } = useAppSelector(s => s.app.order);
  const isFetchingOrder = useAppSelector(s => s.app.fetchingStatus.getOrders);
  const dispatch = useAppDispatch();

  // Search for Orders
  const [search, setSearch] = useState("");

  // Search for Returns (by product names / reason / id)
  const [returnSearch, setReturnSearch] = useState("");

  // Pagination for Orders
  const handlePaginationChange = useCallback(async (pageNumber: number, pageSize: number) => {
    await dispatch(getOrders({ ...input, pageNumber, pageSize })).unwrap();
  }, [dispatch, input]);

  // Refresh Orders (kept as-is)
  const handleRefresh = useCallback(() => {
    dispatch(getOrders(input));
  }, [dispatch, input]);

  // Initial Orders fetch
  useEffect(() => {
    if (!order || !order.length) {
      dispatch(getOrders(input));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter Orders
  const filteredRows = useMemo(() => {
    const q = (search || "").toLowerCase();
    if (!q) return order || [];
    return (order || []).filter((o: any) => {
      const id = String(o?.id ?? "").toLowerCase();
      const desc = String(o?.description ?? "").toLowerCase();
      const status = String(o?.status ?? "").toLowerCase();
      const discount = String(o?.discount ?? "").toLowerCase();
      const amt = String(o?.amountReceived ?? "").toLowerCase();
      const productNames = (o?.ProductInOrder || [])
        .map((po: any) => po?.product?.name || "")
        .join(" ")
        .toLowerCase();

      return (
        id.includes(q) ||
        desc.includes(q) ||
        status.includes(q) ||
        discount.includes(q) ||
        amt.includes(q) ||
        productNames.includes(q)
      );
    });
  }, [order, search]);

  /** ---------- Returns derived helpers (dummy data) ---------- */
  const filteredReturns = useMemo(() => {
    const q = (returnSearch || "").toLowerCase();
    if (!q) return DUMMY_RETURNS;
    return DUMMY_RETURNS.filter(r =>
      r.products.some(p => (p.name || "").toLowerCase().includes(q))
      || (r.description || "").toLowerCase().includes(q)
      || String(r.id).includes(q)
    );
  }, [returnSearch]);

  return (
    <Box px={5} py={3}>
      <Flex mb={5} w="100%" align="center" justify="space-between">
        <Box>
          <Heading fontFamily="poppins" fontSize="3xl" fontWeight="bold">Orders</Heading>
          <Text>Manage customer orders</Text>
        </Box>
        {/* <AddUpdateOrderForm type="Add" /> */}
      </Flex>

      {/* Orders Search + Refresh */}
      <Flex align="center" gap={3} mb={3}>
        <Input
          border="2px solid"
          px={4}
          placeholder="Search Orders"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          borderColor="gray.300"
          bg="white"
        />
        {isFetchingOrder ? (
          <Spinner size="sm" />
        ) : (
          <IconButton
            aria-label="refresh-orders"
            variant="subtle"
            onClick={handleRefresh}
          >
            <IoMdRefresh />
          </IconButton>
        )}
      </Flex>

      {/* Orders Table */}
      <Box border='1px solid var(--chakra-colors-gray-400)' borderRadius='md' mb={8}>
        <Table
          rows={filteredRows}
          onPaginationChange={handlePaginationChange}
          columns={[
            { accessKey: "id", label: "Id", align: "left", format: val => <ViewOrder orderId={val} /> },
            { accessKey: "amountReceived", label: "Amt Rtn", align: "left" },

            // Amount Returned derived from ProductInOrder
            {
              accessKey: "ProductInOrder",
              label: "Amt Recv",
              align: "left",
              format: (val, rowValues) => {
                const lineTotal = (val || []).reduce(
                  (acc: number, curr: any) => acc + (Number(curr.sellPrice) * Number(curr.quantity)),
                  0
                );
                const amountReceived = Number(rowValues?.amountReceived ?? 0);
                return amountReceived - lineTotal;
              }
            },

            // discount
            { accessKey: "discount", label: "Discount", align: "left" },

            // Total derived from ProductInOrder minus discount
            {
              accessKey: "ProductInOrder",
              label: "Total",
              align: "left",
              format: (val, rowValues) => {
                const lineTotal = (val || []).reduce(
                  (acc: number, curr: any) => acc + (Number(curr.sellPrice) * Number(curr.quantity)),
                  0
                );
                const discount = Number(rowValues?.discount ?? 0);
                return lineTotal - discount;
              }
            },

            // Status with badge
            {
              accessKey: "status",
              label: "Status",
              align: "left",
              format: (val, row) => <StatusBadge status={row.status || ""} />
            },

            {
              accessKey: "id",
              label: "Action",
              align: "left",
              format: (val, rowValues) => (
                <Flex gap={4} align='center'>
                  <AddUpdateOrderForm initialValues={rowValues} type="Update" />
                  {/* <DeleteOrderHandlerButton orderId={val} /> */}
                </Flex>
              )
            },
          ]}
          dataFetchingAsync
          loading={isFetchingOrder}
          totalRows={count}
          pageSize={input.pageSize}
          pageNumber={input.pageNumber}
        />
      </Box>

      {/* Return History */}
      <Heading fontFamily="poppins" fontSize="2xl" fontWeight="bold" mb={2}>Return History</Heading>
      <Text mb={3}>All saved returns</Text>

      {/* Return Search */}
      <Flex align="center" gap={3} mb={3}>
        <Input
          border="2px solid"
          px={4}
          placeholder="Search returns by product name, reason, or id"
          onChange={(e) => {}}
          value={undefined as any}
          borderColor="gray.300"
          bg="white"
        />
        {/* Controlled input above; implement below for clarity */}
      </Flex>

      {/* Controlled state for return search (placed after to keep JSX tidy) */}
      <style jsx>{``}</style>
      <Box display="none">{returnSearch}</Box>
      <script dangerouslySetInnerHTML={{ __html: '' }} />

      <Flex align="center" gap={3} mb={3} mt={-12}>
        <Input
          border="2px solid"
          px={4}
          placeholder="Search returns by product name, reason, or id"
          value={returnSearch}
          onChange={(e) => setReturnSearch(e.target.value)}
          borderColor="gray.300"
          bg="white"
        />
      </Flex>

      <Box border='1px solid var(--chakra-colors-gray-400)' borderRadius='md'>
        <Table
          rows={filteredReturns}
          onPaginationChange={async () => { /* no-op for dummy data */ }}
          columns={[
            {
              accessKey: "id",
              label: "Return Id",
              align: "left",
              format: (_val: any, row: ReturnRow) => <ViewReturn ret={row} />
            },
            {
              accessKey: "createdAt",
              label: "Date",
              align: "left",
              format: (val: string) => new Date(val).toLocaleString()
            },
            {
              accessKey: "products",
              label: "Total Amount",
              align: "left",
              format: (val: ReturnRow["products"]) => {
                const t = (val || []).reduce((acc: number, r: any) => acc + r.sellPrice * r.quantity, 0);
                return `Rs ${t.toFixed(2)}`;
              }
            },
            { accessKey: "description", label: "Reason", align: "left" },
          ]}
          dataFetchingAsync={false}
          loading={false}
          totalRows={filteredReturns.length}
          pageSize={filteredReturns.length || 10}
          pageNumber={1}
        />
      </Box>
    </Box>
  )
}
