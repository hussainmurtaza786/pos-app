import { Box, Flex, Heading, IconButton, Input, Text } from "@chakra-ui/react";
import Table from '@/components/Table';
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { IoMdRefresh } from 'react-icons/io';
import { getProducts } from "@/redux/slices/app/productApiThunks";
import { AddUpdateProductForm, DeleteProductHandlerButton, ViewProduct } from "./components";

export default function Product() {
  const { count, input, items: products } = useAppSelector(s => s.app.products);
  const isFetchingProducts = useAppSelector(s => s.app.fetchingStatus.getProducts);
  const dispatch = useAppDispatch();

  // Simple search (same style as Inventory)
  const [search, setSearch] = useState("");

  // Pagination
  const handlePaginationChange = useCallback(async (pageNumber: number, pageSize: number) => {
    await dispatch(getProducts({ ...input, pageNumber, pageSize })).unwrap();
  }, [dispatch]); // include `input` if it changes frequently

  // Initial data fetch
  useEffect(() => {
    if (!products || !products.length) {
      dispatch(getProducts(input));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side filter
const filteredRows = useMemo(() => {
  const q = (search || "").toLowerCase();
  if (!q) return products || [];
  return (products || []).filter(row => {
    const id = String(row?.id || "").toLowerCase();
    const name = (row?.name || "").toLowerCase();
    const sku = (row?.sku || "").toLowerCase();
    const desc = (row?.description || "").toLowerCase();

    // safely handle category which may be string | object | null
    const categoryName =
      typeof row?.category === "string"
        ? row.category
        : (row?.category?.name ?? "");
    const cat = categoryName.toLowerCase();

    return (
      id.includes(q) ||
      name.includes(q) ||
      sku.includes(q) ||
      desc.includes(q) ||
      cat.includes(q)
    );
  });
}, [products, search]);


  return (
    <Box p={5}>
      <Flex mb={5} w="100%" align="center" justify="space-between">
        <Box>
          <Heading fontFamily="poppins" fontSize="3xl" fontWeight="bold">Products</Heading>
          <Text>Manage your product catalog</Text>
        </Box>
        <AddUpdateProductForm type="Add" />
      </Flex>

      {/* Search like Inventory (no InputGroup/Select) */}
      <Flex mb="3" align="center" gap={3}>
        <Input
        border="2px solid"
        px={5}
          placeholder="Search Product"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          borderColor="gray.300"
          bg="white"
        />
        <IconButton
          ml="auto"
          title="Refresh Data"
          variant="subtle"
          onClick={() => dispatch(getProducts(input))}
          aria-label="data-refetch-btn"
        >
          <IoMdRefresh />
        </IconButton>
      </Flex>

      <Box bg="white" border="1px solid var(--chakra-colors-gray-200)" borderRadius="xl" boxShadow="sm">
        <Table
          rows={filteredRows}
          onPaginationChange={handlePaginationChange}
          columns={[
            { accessKey: "id", label: "Id", align: "left", format: val => <ViewProduct productId={val} /> },
            { accessKey: "name", label: "Name", align: "left" },
            {
              accessKey: "price",
              label: "Selling Price",
              align: "left",
              format: money => (money > 0 ? <Box color="green">Rs.{money}</Box> : "")
            },
            { accessKey: "sku", label: "sku", align: "left" },
            { accessKey: "description", label: "description", align: "left" },
            { accessKey: "category", label: "Category", align: "left", format: (category) => category?.name },
            {
              accessKey: "id",
              label: "Action",
              align: "left",
              format: (val, rowValues) => (
                <Flex gap={4} align="center">
                  <AddUpdateProductForm initialValues={rowValues} type="Update" />
                  <DeleteProductHandlerButton productId={val} />
                </Flex>
              )
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
  );
}
