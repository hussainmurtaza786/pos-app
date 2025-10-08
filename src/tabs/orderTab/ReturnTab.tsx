'use client';

import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Flex,
    Heading,
    IconButton,
    Input,
    Text,
    Badge,
    Dialog,
    Portal,
    SkeletonText,
} from "@chakra-ui/react";
import { CloseButton } from "@/components/ui/close-button";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import Table from "@/components/Table";
import { getReturns } from "@/redux/slices/app/returnApiThunk";
import { IoMdRefresh } from "react-icons/io";

/** ================== Types ================== */
export type ReturnRow = {
    id: number;
    createdAt: string;         // ISO
    description?: string | null;
    returnAmount: number;      // <-- CASH RETURNED
    products: { name: string; quantity: number; sellPrice: number }[];
};

/** ================== Helpers ================== */
const formatRs = (n: number) => `Rs ${Number(n || 0).toFixed(2)}`;

/** ================== Modal ================== */
export function ViewReturn({ ret }: { ret: ReturnRow }) {
    // product sum is informational; history uses returnAmount
    const productSum = useMemo(
        () => ret.products.reduce((acc, p) => acc + p.sellPrice * p.quantity, 0),
        [ret.products]
    );

    return (
        <Dialog.Root scrollBehavior="inside" placement="center" size="sm">
            <Dialog.Trigger asChild>
                <Button variant="subtle" color="blue" size="sm">
                    View #{ret.id}
                </Button>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content borderRadius="lg" boxShadow="lg" bg="white">
                        <Dialog.Header p="5" borderBottom="1px solid" borderColor="gray.200">
                            <Dialog.Title fontWeight="bold" fontSize="xl" color="blue.600">
                                Return Details
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" position="absolute" top="4" right="4" />
                        </Dialog.CloseTrigger>

                        <Dialog.Body p="5">
                            <Box fontSize="sm" color="gray.700">
                                <Text mb="2">
                                    <strong>Reason:</strong> {ret.description || "—"}
                                </Text>
                                <Text mb="2">
                                    <strong>Date:</strong>{" "}
                                    {new Date(ret.createdAt).toLocaleString()}
                                </Text>

                                <Box mt="4">
                                    <Text fontWeight="semibold" fontSize="md" mb="2" color="blue.500">
                                        Products (reference)
                                    </Text>
                                    {ret.products.map((pro, idx) => (
                                        <Flex
                                            key={`${ret.id}-${idx}`}
                                            justify="space-between"
                                            align="center"
                                            p="3"
                                            mb="2"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            borderRadius="md"
                                        >
                                            <Box>
                                                <Text fontWeight="medium">{pro.name}</Text>
                                                <Text fontSize="xs" color="gray.500">
                                                    Qty: {pro.quantity}
                                                </Text>
                                            </Box>
                                            <Text fontWeight="semibold">{formatRs(pro.sellPrice)}</Text>
                                        </Flex>
                                    ))}

                                    {/* Informational product total */}
                                    <Box mt="2" borderTop="1px solid" borderColor="gray.200" />
                                    <Flex justify="space-between" mt="2">
                                        <Text>Product Sum</Text>
                                        <Text>{formatRs(productSum)}</Text>
                                    </Flex>

                                    {/* The value that matters for history/accounting */}
                                    <Flex justify="space-between" mt="1">
                                        <Text fontWeight="bold">Cash Returned</Text>
                                        <Text fontWeight="bold">{formatRs(ret.returnAmount)}</Text>
                                    </Flex>
                                </Box>
                            </Box>
                        </Dialog.Body>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}

/** ================== Main: ReturnTable ================== */
export default function ReturnTable() {
    const dispatch = useAppDispatch();

    const store = useAppSelector((s) => s.app.return);
    const isFetching = useAppSelector((s) => s.app.fetchingStatus.getReturn);
    const returnsFromApi = (store?.items as any[]) || [];
    const pagingInput = store?.input;

    const [search, setSearch] = useState("");


    ////// Pagination //////
    const handlePaginationChange = async (pageNumber: number, pageSize: number) => {
        await dispatch(
            getReturns({ ...(pagingInput || {}), pageNumber, pageSize } as any)
        ).unwrap();
    };

    // Initial load
    useEffect(() => {
        if (!returnsFromApi.length) {
            dispatch(getReturns({ pageNumber: 1, pageSize: 50 } as any));
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRefresh = () => {
        dispatch(getReturns(pagingInput || { pageNumber: 1, pageSize: 50 } as any));
    };

    // Shape API rows into ReturnRow
    const rows: ReturnRow[] = useMemo(() => {
        return returnsFromApi.map((r: any) => ({
            id: r.id,
            createdAt: r.createdAt,
            description: r.description ?? null,
            // IMPORTANT: use returnAmount from backend instead of summing lines
            returnAmount: Number(r.returnAmount || 0),
            products: (r.ReturnOrderProduct || []).map((p: any) => ({
                name: p?.product?.name ?? "",
                quantity: Number(p?.quantity || 0),
                sellPrice: Number(p?.sellPrice || 0),
            })),
        }));
    }, [returnsFromApi]);

    // Filter by id / reason / product names (optional)
    const filteredRows = useMemo(() => {
        const q = (search || "").trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) => {
            const id = String(r.id);
            const desc = (r.description || "").toLowerCase();
            const prodNames = r.products.map((p) => p.name.toLowerCase()).join(" ");
            return id.includes(q) || desc.includes(q) || prodNames.includes(q);
        });
    }, [rows, search]);

    const columns = useMemo(
        () => [
            {
                accessKey: "id",
                label: "Return Id",
                align: "left" as const,
                format: (val: number, row: ReturnRow) => (
                    <ViewReturn ret={row} />
                ),
            },
            {
                accessKey: "createdAt",
                label: "Date",
                align: "left" as const,
                format: (iso: string) =>
                    iso ? new Date(iso).toLocaleString() : "",
            },
            {
                accessKey: "description",
                label: "Reason",
                align: "left" as const,
                minWidth: 200,
                format: (v: string | null) => v || "—",
            },
            {
                accessKey: "returnAmount",
                label: "Amount Returned",
                align: "left" as const,
                format: (n: number) => formatRs(Number(n || 0)),
            },
            {
                accessKey: "products",
                label: "Lines",
                align: "left" as const,
                minWidth: 220,
                format: (prods: ReturnRow["products"]) =>
                    prods.length
                        ? prods.map((p) => `${p.name} x${p.quantity}`).join(", ")
                        : "—",
            },
        ],
        []
    );

    return (
        <Box>
            <Flex mb={4} align="center" justify="space-between">
                <Box>
                    <Heading fontFamily="poppins" fontSize="2xl" fontWeight="bold">
                        Return History
                    </Heading>
                    <Text>All cash refunds and return lines</Text>
                </Box>
                {isFetching ? (
                    <Badge colorPalette="blue">Loading…</Badge>
                ) : (
                    <IconButton aria-label="refresh-returns" variant="subtle" onClick={handleRefresh}>
                        <IoMdRefresh />
                    </IconButton>
                )}
            </Flex>

            <Flex align="center" gap={3} mb={3}>
                <Input
                    border="2px solid"
                    px={4}
                    placeholder="Search returns (id / reason / product)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    borderColor="gray.300"
                    bg="white"
                />
            </Flex>

            <Box border="1px solid var(--chakra-colors-gray-400)" borderRadius="md">
                <Table
                    rows={filteredRows}
                    columns={columns as any}
                    dataFetchingAsync
                    loading={isFetching}
                    totalRows={store?.count ?? filteredRows.length}
                    pageSize={pagingInput?.pageSize ?? 50}
                    pageNumber={pagingInput?.pageNumber ?? 1}
                    onPaginationChange={handlePaginationChange}
                    emptyRowMsg={
                        <Text color="gray.500" p={4}>
                            No returns found.
                        </Text>
                    }
                />
            </Box>
        </Box>
    );
}
