import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import Table from '@/components/Table';
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useCallback, useEffect } from "react";

import { AddUpdateOrderForm, ViewOrder, DeleteOrderHandlerButton } from "./components";
import { getOrders } from "@/redux/slices/app/orderApiThunk";

export default function Order() {
    const { count, input, itemFullDataById, items: order } = useAppSelector(s => s.app.order);
    const isFetchingOrder = useAppSelector(s => s.app.fetchingStatus.getOrders);
    const dispatch = useAppDispatch();

    // Handlers
    const handlePaginationChange = useCallback(async (pageNumber: number, pageSize: number) => {
        console.log("pagination called")
        await dispatch(getOrders({ ...input, pageNumber, pageSize })).unwrap();
    }, [dispatch]);

    // Initial data fetch
    useEffect(() => {
        if (!order || !order.length) {
            console.log("useEffect called")
            dispatch(getOrders(input));
        }
    }, []);

    return (
        <Box px={5} py={3}>
            <Flex mb={5} w="100%" align="center" justify="space-between">
                <Box>
                    <Heading fontFamily="poppins" fontSize="3xl" fontWeight="bold">Orders</Heading>
                    <Text>Manage customer orders</Text>
                </Box>
                {/* <AddUpdateOrderForm type="Add" /> */}
            </Flex>

            <Box border='1px solid var(--chakra-colors-gray-400)' borderRadius='md'>
                <Table
                    rows={order || []}
                    onPaginationChange={handlePaginationChange}
                    columns={[
                        { accessKey: "id", label: "Id", align: "left", format: val => <ViewOrder orderId={val} /> },
                        { accessKey: "discount", label: "Discount", align: "left" },
                        { accessKey: "amountReceived", label: "Amount Received", align: "left" },
                        { accessKey: "status", label: "Status", align: "left" },
                        { accessKey: "description", label: "Description", align: "left" },


                        {
                            accessKey: "id", label: "Action", align: "left", format: (val, rowValues) =>
                                <Flex gap={4} align='center'>
                                    <AddUpdateOrderForm initialValues={rowValues} type="Update" />
                                    <DeleteOrderHandlerButton orderId={val} />
                                </Flex>
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
