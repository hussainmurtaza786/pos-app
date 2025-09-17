import { Box, Flex, Heading, Text, Icon, IconButton, Input, } from "@chakra-ui/react";
import Table from '@/components/Table';
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IoMdRefresh } from "react-icons/io";
import { MdCheckCircle, MdWarningAmber, MdDangerous } from "react-icons/md";
import { getInventories } from "@/redux/slices/app/inventoryApiThunks";
import { AddUpdateInventoryForm, DeleteInventoryHandlerButton, ViewInventory, StockStatusBadge, LOW_STOCK_THRESHOLD, } from "./components";

export default function Inventory() {
    const { count, input, items: inventory } = useAppSelector(s => s.app.inventory);
    const isFetchingInventory = useAppSelector(s => s.app.fetchingStatus.getInventories);
    const dispatch = useAppDispatch();

    // Simple search like Product tab
    const [search, setSearch] = useState("");

    // Pagination
    const handlePaginationChange = useCallback(async (pageNumber: number, pageSize: number) => {
        await dispatch(getInventories({ ...input, pageNumber, pageSize })).unwrap();
    }, [dispatch]); // include `input` if it changes often

    // Initial data fetch
    useEffect(() => {
        if (!inventory || !inventory.length) {
            dispatch(getInventories(input));
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Summary counts
    const { inStockCount, lowStockCount, outOfStockCount } = useMemo(() => {
        let inStock = 0, low = 0, out = 0;
        (inventory || []).forEach(row => {
            const qty = row.availableQuantity ?? 0;
            if (qty <= 0) out += 1;
            else if (qty <= LOW_STOCK_THRESHOLD) low += 1;
            else inStock += 1;
        });
        return { inStockCount: inStock, lowStockCount: low, outOfStockCount: out };
    }, [inventory]);

    // Apply only text search (like Product tab)
    const filteredRows = useMemo(() => {
        const q = (search || "").toLowerCase();
        if (!q) return inventory || [];
        return (inventory || []).filter(row => {
            const name = (row?.product?.name || "").toLowerCase();
            const id = String(row?.id || "").toLowerCase();
            return name.includes(q) || id.includes(q);
        });
    }, [inventory, search]);

    return (
        <Box p={5}>
            {/* Header */}
            <Flex mb={5} w="100%" align="center" justify="space-between">
                <Box>
                    <Heading fontFamily="poppins" fontSize="3xl" fontWeight="bold">Inventory</Heading>
                    <Text color="gray.600">Manage your product inventory and stock levels</Text>
                </Box>
                <Flex gap={3} align="center">
                    <IconButton
                        title='Refresh Data'
                        variant='subtle'
                        onClick={() => dispatch(getInventories(input))}
                        aria-label='data-refetch-btn'
                    >
                        <IoMdRefresh />
                    </IconButton>
                    <AddUpdateInventoryForm type="Add" />
                </Flex>
            </Flex>

            {/* Summary Cards */}
            <Flex gap={4} wrap="wrap" mb={4}>
                <Box flex="1 1 260px" bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={5} boxShadow="sm">
                    <Flex align="center" gap={3}>
                        <Box w="36px" h="36px" borderRadius="full" bg="green.50" display="grid" placeItems="center">
                            <Icon as={MdCheckCircle} boxSize={5} color="green.500" />
                        </Box>
                        <Box>
                            <Heading size="md">{inStockCount}</Heading>
                            <Text color="gray.600">In Stock</Text>
                        </Box>
                    </Flex>
                </Box>

                <Box flex="1 1 260px" bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={5} boxShadow="sm">
                    <Flex align="center" gap={3}>
                        <Box w="36px" h="36px" borderRadius="full" bg="yellow.50" display="grid" placeItems="center">
                            <Icon as={MdWarningAmber} boxSize={5} color="yellow.600" />
                        </Box>
                        <Box>
                            <Heading size="md">{lowStockCount}</Heading>
                            <Text color="gray.600">Low Stock</Text>
                        </Box>
                    </Flex>
                </Box>

                <Box flex="1 1 260px" bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={5} boxShadow="sm">
                    <Flex align="center" gap={3}>
                        <Box w="36px" h="36px" borderRadius="full" bg="red.50" display="grid" placeItems="center">
                            <Icon as={MdDangerous} boxSize={5} color="red.500" />
                        </Box>
                        <Box>
                            <Heading size="md">{outOfStockCount}</Heading>
                            <Text color="gray.600">Out of Stock</Text>
                        </Box>
                    </Flex>
                </Box>
            </Flex>

            {/* Search bar (like Product tab) */}
            <Flex align="center" gap={3} mb={3}>
                <Input
                    border="2px solid"
                    px={4}
                    placeholder="Search Inventory"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    borderColor="gray.300"
                    bg="white"
                />
                <IconButton
                    aria-label="refresh"
                    title="Refresh"
                    variant="subtle"
                    onClick={() => dispatch(getInventories(input))}
                >
                    <IoMdRefresh />
                </IconButton>
            </Flex>

            {/* Table */}
            <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" boxShadow="sm">
                <Table
                    rows={filteredRows}
                    onPaginationChange={handlePaginationChange}
                    columns={[
                        { accessKey: "id", label: "Id", align: "left", format: val => <ViewInventory InventoryId={val} /> },
                        { accessKey: "product", label: "Product", align: "left", format: prod => prod?.name },
                        { accessKey: "purchasedQuantity", label: "Purchased Qty", align: "left" },
                        { accessKey: "availableQuantity", label: "Available Qty", align: "left" },
                        { accessKey: "purchasePrice", label: "Purchase Price", align: "left" },

                        // Status BEFORE Action
                        {
                            accessKey: "availableQuantity",
                            label: "Status",
                            align: "left",
                            format: (val, row) => <StockStatusBadge availableQuantity={row.availableQuantity ?? 0} />
                        },

                        {
                            accessKey: "id",
                            label: "Action",
                            align: "left",
                            format: (val, rowValues) => (
                                <Flex gap={3} align='center'>
                                    <AddUpdateInventoryForm initialValues={rowValues} type="Update" />
                                    <DeleteInventoryHandlerButton inventoryId={val} />
                                </Flex>
                            )
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
