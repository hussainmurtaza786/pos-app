import { Box, Button, Flex, Heading, IconButton, Image, Input, InputGroup, Text } from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";
import Table from '@/components/Table';
import { LiaEdit } from "react-icons/lia";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";

import { IoMdRefresh } from 'react-icons/io';
import SearchProduct from "../common/SearchProduct";
import { getProducts } from "@/redux/slices/app/productApiThunks";
import { AddUpdateProductForm, DeleteProductHandlerButton, ViewProduct } from "./components";

export default function Product() {
    const { count, input, itemFullDataById, items: products } = useAppSelector(s => s.app.products);
    const isFetchingProducts = useAppSelector(s => s.app.fetchingStatus.getProducts);
    const dispatch = useAppDispatch();

    // Handlers
    const handlePaginationChange = useCallback(async (pageNumber: number, pageSize: number) => {
        console.log("pagination called")
        await dispatch(getProducts({ ...input, pageNumber, pageSize })).unwrap();
    }, [dispatch]);


    // Initial data fetch
    useEffect(() => {
        if (!products || !products.length) {
            console.log("useEffect called")
            dispatch(getProducts(input));
        }
    }, []);

    return (
        <Box >
            <Flex mb={5} w="100%" align="center" justify="space-between">
                <Box>
                    <Heading fontFamily="poppins" fontSize="3xl" fontWeight="bold">Products</Heading>
                    <Text>Manage your product catalog</Text>
                </Box>
                {/* <Button bgColor="#326d6d" color="white" px={3} py={2} fontSize="md">+ Add Product</Button> */}
                <AddUpdateProductForm type="Add" />
            </Flex>

            <Flex mb='3' align='center' gap={3}>
                {/* <InputGroup w="400px" ml={2} borderRadius="5px" mb={4} color="#ccc" startElement={<LuSearch color='grey' size={18} />}>
                    <Input ms="-2" color="black" placeholder="Search Products..." borderColor='gray.400' />
                </InputGroup> */}
                <SearchProduct />
                <IconButton ml='auto' title='Refresh Data' variant='subtle' onClick={() => dispatch(getProducts(input))} aria-label='data-refetch-btn'>
                    <IoMdRefresh />
                </IconButton>
            </Flex>

            <Box border='1px solid var(--chakra-colors-gray-400)' borderRadius='md'>
                <Table
                    // rows={Dummy}
                    rows={products || []}
                    onPaginationChange={handlePaginationChange}
                    columns={[
                        // { accessKey: "media", label: "", align: "left", format: (val: Media[]) => <Box boxSize='120px' bgImg={`url(${val[0].url})`} bgSize='cover' bgPos='center' /> },
                        { accessKey: "id", label: "Id", align: "left", format: val => <ViewProduct productId={val} /> },
                        { accessKey: "name", label: "Name", align: "left" },
                        // { accessKey: "description", label: "Description", align: "left" },
                        { accessKey: "price", label: "Price", align: "left", format: money => money > 0 ? <Box color='green' >Rs.{money} </Box> : "" },
                        // { accessKey: "name", label: "name", align: "left", format: money => money > 0 ? <Box color='red' >Rs.{money} </Box> : "" },
                        { accessKey: "sku", label: "sku", align: "left", },
                        { accessKey: "description", label: "description", align: "left", },
                        {
                            accessKey: "category", label: "Category", align: "left", format: (category) => category?.name
                        },

                        {
                            accessKey: "id", label: "Action", align: "left", format: (val, rowValues) =>
                                <Flex gap={4} align='center'>
                                    {/* <ViewProduct /> */}
                                    {/* <LiaEdit size={20} /> */}
                                    <AddUpdateProductForm initialValues={rowValues} type="Update" />
                                    <DeleteProductHandlerButton productId={val} />
                                </Flex>
                        },
                    ]}
                    dataFetchingAsync
                    loading={isFetchingProducts}
                    totalRows={count}
                    pageSize={input.pageSize}
                    pageNumber={input.pageNumber}
                />
            </Box>
        </Box>
    )
}




