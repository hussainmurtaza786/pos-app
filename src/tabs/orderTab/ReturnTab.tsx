'use client';
import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Flex, Heading, IconButton, Input, Text, Dialog, Button, Portal, CloseButton, SkeletonText, } from "@chakra-ui/react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import Table from "@/components/Table";
import { getReturnById, getReturns } from "@/redux/slices/app/returnApiThunk";
import { IoMdRefresh } from "react-icons/io";
import { InlineSpinner } from "@/components/CustomFunctions";

/** ================== Main: ReturnTable ================== */
export default function ReturnTable() {

    const dispatch = useAppDispatch();

    const isFetchingReturn = useAppSelector((s) => s.app.fetchingStatus.getReturns);
    const { count, input, items: returns } = useAppSelector(s => s.app.return);

    useEffect(() => {
        console.log({ isFetchingReturn, returns });
    }, [isFetchingReturn, returns]);
    const [search, setSearch] = useState("");


    ////// Pagination //////
    const handlePaginationChange = useCallback(async (pageNumber: number, pageSize: number) => {
        await dispatch(getReturns({ ...input, pageNumber, pageSize })).unwrap();
    }, [dispatch, input]);

    useEffect(() => {
        if (!returns || !returns.length) {
            dispatch(getReturns(input));
        }
    }, []);
    const handleRefresh = useCallback(() => {
        dispatch(getReturns(input));
    }, [dispatch, input]);
    // Shape API rows into ReturnRow
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
        <Box>
            <Flex mb={4} align="center" justify="space-between">
                <Box>
                    <Heading fontFamily="poppins" fontSize="2xl" fontWeight="bold">
                        Return History
                    </Heading>
                    <Text>All cash refunds and return lines</Text>
                </Box>
            </Flex>

            <Flex align="center" gap={3} mb={3}>
                <Input border="2px solid" px={4} placeholder="Search Orders" value={search} onChange={(e) => setSearch(e.target.value)} borderColor="gray.300" bg="white" />
                {isFetchingReturn ? (
                    <InlineSpinner />
                ) : (
                    <IconButton aria-label="refresh-orders" variant="subtle" onClick={handleRefresh}>
                        <IoMdRefresh />
                    </IconButton>
                )}
            </Flex>

            <Box border="1px solid var(--chakra-colors-gray-400)" borderRadius="md">
                <Table
                    rows={filteredRows}
                    onPaginationChange={handlePaginationChange}
                    columns={[
                        { accessKey: "id", label: "Id", align: "left", format: val => <ViewReturn returnId={val} /> },
                        {
                            accessKey: "createdAt", label: "Return Time", align: "left", format: (val: string | Date) => {
                                if (!val) return "—";
                                const d = new Date(val);
                                return d.toLocaleString("en-PK", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                });
                            },
                        },

                        { accessKey: "returnAmount", label: "Return Amount", align: "left", },
                        { accessKey: "description", label: "Description", align: "left", },

                    ]}
                    dataFetchingAsync
                    loading={isFetchingReturn}
                    totalRows={count}
                    pageSize={input.pageSize}
                    pageNumber={input.pageNumber}
                />
            </Box>
        </Box>
    );
}


export function ViewReturn({ returnId }: { returnId: number }) {
    const dispatch = useAppDispatch();
    const _return = useAppSelector(s => s.app.return.itemFullDataById[returnId] || null);
    const [modalOpenState, setModalOpenState] = useState(false);

    useEffect(() => {
        if (modalOpenState && !_return) {
            dispatch(getReturnById(returnId));
        }
    }, [modalOpenState]);

    return (
        <Dialog.Root onOpenChange={({ open }) => setModalOpenState(open)} scrollBehavior="inside" placement="center" size="sm">
            <Dialog.Trigger asChild>
                <Button variant="subtle" color="blue" size="sm">
                    View #{returnId}
                </Button>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content borderRadius="lg" boxShadow="lg" bg="white">
                        <Dialog.Header p="5" borderBottom="1px solid" borderColor="gray.200">
                            <Dialog.Title fontWeight="bold" fontSize="xl" color="blue.600">
                                Return Order Details
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" position="absolute" top="4" right="4" />
                        </Dialog.CloseTrigger>

                        {_return ? (
                            <Dialog.Body p="5">
                                <Box fontSize="sm" color="gray.700">
                                    <Text mb="2">
                                        <strong>Description:</strong> {_return.description || "—"}
                                    </Text>

                                    <Box mt="4">
                                        <Text fontWeight="semibold" fontSize="md" mb="2" color="blue.500">
                                            Products
                                        </Text>
                                        {_return.ReturnOrderProduct?.map((pro: any) => (
                                            <Flex key={`${pro.orderId}-${pro.productId}`} justify="space-between" align="center" p="3" mb="2" border="1px solid" borderColor="gray.200" borderRadius="md" _hover={{ bg: "gray.50" }}>
                                                <Box>
                                                    <Text fontWeight="medium">{pro.product?.name}</Text>
                                                    <Text fontSize="xs" color="gray.500">
                                                        Qty: {pro.quantity}
                                                    </Text>
                                                </Box>
                                                <Text fontWeight="semibold">{pro.sellPrice}</Text>
                                            </Flex>
                                        ))}
                                    </Box>
                                </Box>
                            </Dialog.Body>
                        ) : (
                            <Dialog.Body p="5">
                                <SkeletonText noOfLines={6} />
                            </Dialog.Body>
                        )}
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
