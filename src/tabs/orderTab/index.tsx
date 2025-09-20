import { Box, Flex, Heading, Text, IconButton, Spinner, Input } from "@chakra-ui/react";
import Table from '@/components/Table';
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AddUpdateOrderForm, ViewOrder, StatusBadge } from "./components";
import { getOrders } from "@/redux/slices/app/orderApiThunk";
import { IoMdRefresh } from "react-icons/io";

export default function Order() {
    const { count, input, items: order } = useAppSelector(s => s.app.order);
    const isFetchingOrder = useAppSelector(s => s.app.fetchingStatus.getOrders);
    const dispatch = useAppDispatch();

    // Simple search (same UX as Inventory)
    const [search, setSearch] = useState("");

    // Pagination
    const handlePaginationChange = useCallback(async (pageNumber: number, pageSize: number) => {
        await dispatch(getOrders({ ...input, pageNumber, pageSize })).unwrap();
    }, [dispatch, input]);

    // Refresh
    const handleRefresh = useCallback(() => {
        dispatch(getOrders(input));
    }, [dispatch, input]);

    // Initial data fetch
    useEffect(() => {
        if (!order || !order.length) {
            dispatch(getOrders(input));
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Client-side filter (id, description, status, discount, amount, product names)
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

    return (
        <Box px={5} py={3}>
            <Flex mb={5} w="100%" align="center" justify="space-between">
                <Box>
                    <Heading fontFamily="poppins" fontSize="3xl" fontWeight="bold">Orders</Heading>
                    <Text>Manage customer orders</Text>
                </Box>
                {/* <AddUpdateOrderForm type="Add" /> */}
            </Flex>

            {/* Search bar (same style as Inventory) */}
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
                {/* Refresh button */}
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

            <Box border='1px solid var(--chakra-colors-gray-400)' borderRadius='md'>
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

                        //discount
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
        </Box>
    )
}
