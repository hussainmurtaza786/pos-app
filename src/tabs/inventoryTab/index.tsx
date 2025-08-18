import { Box, Button, Flex, Heading, IconButton, Image, Input, InputGroup, Text } from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";
import Table from '@/components/Table';
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useCallback, useEffect } from "react";
import { IoMdRefresh } from "react-icons/io";
import { getInventories } from "@/redux/slices/app/inventoryApiThunks";
import { AddUpdateInventoryForm, DeleteInventoryHandlerButton, ViewInventory } from "./components";


export default function Inventory() {
    const { count, input, itemFullDataById, items: inventory } = useAppSelector(s => s.app.inventory);
    const isFetchingInventory = useAppSelector(s => s.app.fetchingStatus.getInventories);
    const dispatch = useAppDispatch();

    // Handlers
    const handlePaginationChange = useCallback(async (pageNumber: number, pageSize: number) => {
        console.log("pagination called")
        await dispatch(getInventories({ ...input, pageNumber, pageSize })).unwrap();
    }, [dispatch]);


    // Initial data fetch
    useEffect(() => {
        if (!inventory || !inventory.length) {
            console.log("useEffect called")
            dispatch(getInventories(input));
        }
    }, []);

    return (
        <Box>
            <Flex mb={5} w="100%" align="center" justify="space-between">
                <Box>
                    <Heading fontFamily="poppins" fontSize="3xl" fontWeight="bold">Inventory</Heading>
                    <Text>Manage supplier relationships</Text>
                </Box>
                {/* <Button bgColor="#326d6d" color="white" px={3} py={2} fontSize="md">+ Add Inventory</Button> */}
                <AddUpdateInventoryForm type="Add" />

            </Flex>

            {/* <InputGroup w="400px" ml={2} borderRadius="5px" mb={4} color="#ccc" startElement={<LuSearch color='grey' size={18} />}>
                <Input ms="-2" color="black" placeholder="Search buyers..." borderColor='gray.400' />
            </InputGroup>
            <IconButton ml='auto' title='Refresh Data' variant='subtle' onClick={() => dispatch(getInventories(input))} aria-label='data-refetch-btn'>
                <IoMdRefresh />
            </IconButton> */}
            {/* <Flex mb='3' align='center' gap={3}>
                <InputGroup w="400px" ml={2} borderRadius="5px" mb={4} color="#ccc" startElement={<LuSearch color='grey' size={18} />}>
                                <Input ms="-2" color="black" placeholder="Search Products..." borderColor='gray.400' />
                            </InputGroup>
                <SearchInv />
                <IconButton ml='auto' title='Refresh Data' variant='subtle' onClick={() => dispatch(getInventories(input))} aria-label='data-refetch-btn'>
                    <IoMdRefresh />
                </IconButton>
            </Flex> */}

            <Box border='1px solid var(--chakra-colors-gray-400)' borderRadius='md'>
                <Table
                    // rows={Dummy}
                    rows={inventory || []}
                    onPaginationChange={handlePaginationChange}
                    columns={[
                        // { accessKey: "id", label: "Id", align: "left" },
                        { accessKey: "id", label: "Id", align: "left", format: val => <ViewInventory InventoryId={val} /> },
                        { accessKey: "name", label: "Product", align: "left" },
                        { accessKey: "purchasedQuantity", label: "Purchased Qty", align: "left" },
                        { accessKey: "availableQuantity", label: "Available Qty", align: "left" },
                        { accessKey: "purchasePrice", label: "Purchase Price", align: "left" },

                        {
                            accessKey: "id", label: "Action", align: "left", format: (val, rowValues) =>
                                <Flex gap={4} align='center'>
                                    {/* <ViewProduct /> */}
                                    {/* <LiaEdit size={20} /> */}
                                    <AddUpdateInventoryForm initialValues={rowValues} type="Update" />
                                    <DeleteInventoryHandlerButton inventoryId={val} />
                                </Flex>
                        },
                    ]}
                    dataFetchingAsync
                    loading={isFetchingInventory}
                    totalRows={count}
                    pageSize={input.pageSize}
                    pageNumber={input.pageNumber}
                />
            </Box>
        </Box>
    )
}

