"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Spinner,
  Text,
  Button,
  Flex,
  Table,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getOrders } from "@/redux/slices/app/orderApiThunk";

const OrdersTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Pagination states
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const { items, count } = useSelector((state: RootState) => state.app.order);
  const loading = useSelector(
    (state: RootState) => state.app.fetchingStatus.getOrders
  );

  console.log('Orders state:', { items, count, loading });

  // Fetch on mount & page change
  useEffect(() => {
    dispatch(getOrders({ pageNumber, pageSize }));
  }, [dispatch, pageNumber]);

  const totalPages = Math.ceil(count / pageSize);

  return (
    <Box p={6}>
      <Text fontSize="2xl" mb={4} fontWeight="bold">
        Orders
      </Text>

      {loading && (
        <Flex justify="center" align="center" py={10}>
          <Spinner size="xl" />
        </Flex>
      )}

      {!loading && items?.length === 0 && (
        <Text textAlign="center" py={6}>
          No orders found
        </Text>
      )}

      {!loading && items && items.length > 0 && (
        <>
          <Table.Root variant="outline" size="md">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>ID</Table.ColumnHeader>
                <Table.ColumnHeader>Discount</Table.ColumnHeader>
                <Table.ColumnHeader>Amount Received</Table.ColumnHeader>
                <Table.ColumnHeader>Description</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Products</Table.ColumnHeader> {/* ✅ new column */}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((order) => (
                <Table.Row key={order.id}>
                  <Table.Cell>{order.id}</Table.Cell>
                  <Table.Cell>{order.discount}</Table.Cell>
                  <Table.Cell>{order.amountReceived}</Table.Cell>
                  <Table.Cell>{order.description}</Table.Cell>
                  <Table.Cell>{order.status}</Table.Cell>
                  <Table.Cell>
                    {order.ProductInOrder?.map((pro) => (
                      <Box
                        key={`${pro.orderId}-${pro.productId}`} // ✅ unique key
                        borderBottom="1px solid"
                        borderColor="gray.200"
                        pb={2}
                        mb={2}
                        _last={{ borderBottom: "none", pb: 0, mb: 0 }}
                      >
                        <Text fontWeight="bold">{pro.product?.name}</Text>
                        <Text fontSize="sm">Qty: {pro.quantity}</Text>
                        <Text fontSize="sm">Price: {pro.sellPrice}</Text>
                      </Box>
                    ))}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
            <Table.Footer>
              <Table.Row>
                <Table.Cell colSpan={6}>
                  <Flex justify="center" mt={4} gap={2}>
                    <Button
                      size="sm"
                      onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
                      disabled={pageNumber === 1}
                    >
                      Previous
                    </Button>

                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i}
                        size="sm"
                        onClick={() => setPageNumber(i + 1)}
                        colorScheme={pageNumber === i + 1 ? "blue" : "gray"}
                      >
                        {i + 1}
                      </Button>
                    ))}

                    <Button
                      size="sm"
                      onClick={() =>
                        setPageNumber((p) => Math.min(p + 1, totalPages))
                      }
                      disabled={pageNumber === totalPages}
                    >
                      Next
                    </Button>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            </Table.Footer>
          </Table.Root>
        </>
      )}
    </Box>
  );
};

export default OrdersTable;
