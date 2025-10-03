"use client";

import { 
    Box,
    Flex,
    Heading,
    Text,
    Icon,
    IconButton,
    Input,
} from "@chakra-ui/react";
import Table from "@/components/Table";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IoMdRefresh } from "react-icons/io";


// Example components you might want to make like Inventory:
// - AddUpdateReturnForm
// - DeleteReturnHandlerButton
// - ViewReturn
// import { AddUpdateReturnForm, DeleteReturnHandlerButton, ViewReturn, } from "./components";
import { getReturns } from "@/redux/slices/app/returnApiThunk";

export default function ReturnTable() {
    const { count, input, items: returns } = useAppSelector(
        (s) => s.app.return
    );
    const isFetchingReturns = useAppSelector(
        (s) => s.app.fetchingStatus.getReturn
    );
    const dispatch = useAppDispatch();

    // Search
    const [search, setSearch] = useState("");

    // Pagination
    const handlePaginationChange = useCallback(
        async (pageNumber: number, pageSize: number) => {
            await dispatch(getReturns({ ...input, pageNumber, pageSize })).unwrap();
        },
        [dispatch] // include input if it changes dynamically
    );

    // Initial fetch
    useEffect(() => {
        if (!returns || !returns.length) {
            dispatch(getReturns(input));
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Filtered rows
    const filteredRows = useMemo(() => {
        const q = (search || "").toLowerCase();
        if (!q) return returns || [];
        return (returns || []).filter((row) => {
            const desc = (row?.description || "").toLowerCase();
            const id = String(row?.id || "").toLowerCase();
            return desc.includes(q) || id.includes(q);
        });
    }, [returns, search]);

    return (
        <Box p={5}>
            {/* Header */}
            <Flex mb={5} w="100%" align="center" justify="space-between">
                <Box>
                    <Heading fontFamily="poppins" fontSize="3xl" fontWeight="bold">
                        Returns
                    </Heading>
                    <Text color="gray.600">Manage product return orders</Text>
                </Box>
                {/* <AddUpdateReturnForm type="Add" /> */}
            </Flex>

            {/* Search + Refresh */}
            <Flex align="center" gap={3} mb={3}>
                <Input
                    border="2px solid"
                    px={4}
                    placeholder="Search Returns"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    borderColor="gray.300"
                    bg="white"
                />
                <IconButton
                    aria-label="refresh"
                    title="Refresh"
                    variant="subtle"
                    onClick={() => dispatch(getReturns(input))}
                >
                    <IoMdRefresh />
                </IconButton>
            </Flex>

            {/* Table */}
            <Box
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="xl"
                boxShadow="sm"
            >
                <Table
                    rows={filteredRows}
                    onPaginationChange={handlePaginationChange}
                    columns={[
                        {
                            accessKey: "id",
                            label: "Id",
                            align: "left",
                            //   format: (val) => <ViewReturn returnId={val} />,
                        },
                        {
                            accessKey: "createdAt",
                            label: "Date",
                            align: "left",
                            format: (val) => new Date(val).toLocaleString(),
                        },

                        // {
                        //   accessKey: "createdBy",
                        //   label: "Created By",
                        //   align: "left",
                        //   format: (val) => val?.name || "-",
                        // },

                        {
                            accessKey: "ReturnOrderProduct",
                            label: "Total Amount",
                            align: "left",
                            format: (val) =>
                                Array.isArray(val) && val.length > 0 ? (
                                    <Box>
                                        {val.map((p: any, i: number) => (
                                            <Text key={i} fontSize="sm">
                                                {p.product?.name} — {p.quantity} × {p.sellPrice}
                                            </Text>
                                        ))}
                                    </Box>
                                ) : (
                                    <Text color="gray.500" fontSize="sm">
                                        No Products
                                    </Text>
                                ),
                        },

                        {
                            accessKey: "description",
                            label: "Description",
                            align: "left",
                        },

                    ]}
                    dataFetchingAsync
                    loading={isFetchingReturns}
                    totalRows={count}
                    pageSize={input.pageSize}
                    pageNumber={input.pageNumber}
                />
            </Box>
        </Box>
    );
}
