import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import Table from '@/components/Table';
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useCallback, useEffect } from "react";
import { IoMdRefresh } from "react-icons/io";
import { getProductInOrders } from "@/redux/slices/app/productInOrderApiThunk";
import { ViewProductInOrder } from "./components";

export default function ProductInOrder() {
    const { count, input, items: productInOrders } = useAppSelector(s => s.app.productInOrder);
    const isFetchingProductInOrders = useAppSelector(s => s.app.fetchingStatus.getProductInOrders);
    const dispatch = useAppDispatch();

    console.log('productInOrders --->', productInOrders);
    // Handlers
    const handlePaginationChange = useCallback(async (pageNumber: number, pageSize: number) => {
        await dispatch(getProductInOrders({ ...input, pageNumber, pageSize })).unwrap();
    }, [dispatch, input]);
    useEffect(() => {
        console.log("productInOrders JSON --->", JSON.stringify(productInOrders, null, 2));
    }, [productInOrders]);

    // Initial data fetch
    useEffect(() => {
        if (!productInOrders || !productInOrders.length) {
            dispatch(getProductInOrders(input));
        }
    }, [dispatch, productInOrders, input]);

    return (
        <Box>
            <Flex mb={5} w="100%" align="center" justify="space-between">
                <Box>
                    <Heading fontFamily="poppins" fontSize="3xl" fontWeight="bold">Products In Orders</Heading>
                    <Text>Manage products assigned to orders</Text>
                </Box>
                {/* <AddUpdateProductInOrderForm type="Add" /> */}
            </Flex>

            <Box border='1px solid var(--chakra-colors-gray-400)' borderRadius='md'>
                {/* <Box border='1px solid var(--chakra-colors-gray-400)' borderRadius='md' p={4} minH="200px">
                    {isFetchingProductInOrders ? (
                        <Text textAlign="center" color="gray.500">Loading...</Text>
                    ) : !productInOrders || productInOrders.length === 0 ? (
                        <Text textAlign="center" color="gray.500">No data available</Text>
                    ) : (
                        <Table
                            rows={productInOrders}
                            onPaginationChange={handlePaginationChange}
                            columns={[
                                { accessKey: "orderId", label: "Order ID", align: "left" },
                                { accessKey: "productId", label: "Product ID", align: "left" },
                                { accessKey: "quantity", label: "Quantity", align: "left" },
                            ]}
                            dataFetchingAsync
                            loading={false}   // 👈 disable spinner since we handle empty/loading ourselves
                            totalRows={count}
                            pageSize={input.pageSize}
                            pageNumber={input.pageNumber}
                        />
                    )}
                </Box> */}
                <Table
                    rows={productInOrders || []}
                    onPaginationChange={handlePaginationChange}
                    columns={[
                        // { 
                        //   accessKey: "compositeId", 
                        //   label: "ID", 
                        //   align: "left", 
                        //   format: val => <ViewProductInOrder productInOrderId={val} /> 
                        // },
                        { accessKey: "orderId", label: "Order ID", align: "left", format: val => <ViewProductInOrder orderId={val} productId={val} /> },

                        // { accessKey: "orderId", label: "Order ID", align: "left" },
                        // { accessKey: "productId", label: "Product ID", align: "left" },
                        { accessKey: "quantity", label: "Quantity", align: "left" },
                        { accessKey: "sellPrice", label: "Sell Price", align: "left" },
                        // { accessKey: "productId", label: "Sell Price", align: "left" },
                        { accessKey: "product", label: "Product Name", align: "left", format: (_, row) => row.product?.name || "—", },
                        { accessKey: "order", label: "Status", align: "left", format: (_, row) => row.order?.status || "—", },
                        { accessKey: "order", label: "Discount", align: "left", format: (_, row) => row.order?.discount || "—", },
                        // { accessKey: "order", label: "Amount Received", align: "left", format: (_, row) => row.order?.amountReceived || "—", },

                        // { accessKey: "inventoryId", label: "Inventory Id  ", align: "left" },
                        // { accessKey: "price", label: "Price", align: "left" },
                        // {
                        //     accessKey: "compositeId", 
                        //     label: "Action", 
                        //     align: "left", 
                        //     format: (val, rowValues) =>
                        //         <Flex gap={4} align='center'>
                        //             <AddUpdateProductInOrderForm initialValues={rowValues} type="Update" />
                        //             <DeleteProductInOrderHandlerButton productInOrderKey={val} />
                        //         </Flex>
                        // },
                    ]}
                    dataFetchingAsync
                    loading={isFetchingProductInOrders}
                    totalRows={count}
                    pageSize={input.pageSize}
                    pageNumber={input.pageNumber}
                />
            </Box>
        </Box>
    )
}
