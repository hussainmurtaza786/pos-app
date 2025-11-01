import { Box, Flex, Heading, Text, IconButton, Spinner, Input } from "@chakra-ui/react";
import Table from '@/components/Table';
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AddUpdateOrderForm, ViewOrder, StatusBadge, ViewReturn, ReturnRow } from "./components";
import { getOrders } from "@/redux/slices/app/orderApiThunk";
import { IoMdRefresh } from "react-icons/io";
import ReturnTable from "./ReturnTab";
import { InlineSpinner } from "@/components/CustomFunctions";


export default function Order() {
  const dispatch = useAppDispatch();
  const { count, input, items: order } = useAppSelector(s => s.app.order);
  const isFetchingOrder = useAppSelector(s => s.app.fetchingStatus.getOrders);
  const [search, setSearch] = useState("");


  // Pagination for Orders.
  const handlePaginationChange = useCallback(async (pageNumber: number, pageSize: number) => {
    await dispatch(getOrders({ ...input, pageNumber, pageSize })).unwrap();
  }, [dispatch]);

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
      const productNames = (o?.ProductInOrder || [])
        .map((po: any) => po?.product?.name || "")
        .join(" ")
        .toLowerCase();

      return (
        id.includes(q) ||
        desc.includes(q) ||
        productNames.includes(q)
      );
    });
  }, [order, search]);



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
        <Input border="2px solid" px={4} placeholder="Search With Id, Description..." value={search} onChange={(e) => setSearch(e.target.value)} borderColor="gray.300" bg="white" />
        {isFetchingOrder ? (
          <InlineSpinner />
        ) : (
          <IconButton aria-label="refresh-orders" variant="subtle" onClick={handleRefresh}>
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
            { accessKey: "amountReceived", label: "Amt Recv", align: "left" },
            {
              accessKey: "ProductInOrder", label: "Amt Rtn", align: "left", format: (val, rowValues) => {
                const lineTotal = (val || []).reduce(
                  (acc: number, curr: any) => acc + (Number(curr.sellPrice) * Number(curr.quantity)),
                  0
                );
                const amountReceived = Number(rowValues?.amountReceived ?? 0);
                return amountReceived - lineTotal;
              }
            },
            { accessKey: "discount", label: "Discount", align: "left" },
            {
              accessKey: "ProductInOrder", label: "Total", align: "left",
              format: (val, rowValues) => {
                const lineTotal = (val || []).reduce(
                  (acc: number, curr: any) => acc + (Number(curr.sellPrice) * Number(curr.quantity)),
                  0
                );
                const discount = Number(rowValues?.discount ?? 0);
                return lineTotal - discount;
              }
            },
            { accessKey: "status", label: "Status", align: "left", format: (val, row) => <StatusBadge status={row.status || ""} /> },
            {
              accessKey: "id",
              label: "Action",
              align: "left",
              format: (val, rowValues) => (
                <Flex gap={4} align="center">
                  {rowValues.status?.toLowerCase() === "pending" ? (
                    <AddUpdateOrderForm initialValues={rowValues} type="Update" />
                  ) : (
                    <Text fontSize="sm" color="gray.500">Can't Update</Text>
                  )}
                </Flex>
              )
            }

          ]}
          dataFetchingAsync
          loading={isFetchingOrder}
          totalRows={count}
          pageSize={input.pageSize}
          pageNumber={input.pageNumber}
        />
      </Box>

      {/* ////////////////////////////////////////// Return History ////////////////////////////////////// */}

      <ReturnTable />
    </Box>
  )
}
