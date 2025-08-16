'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BiPlus } from 'react-icons/bi';
import { FiEdit2 } from 'react-icons/fi';
import { BsTrash2 } from 'react-icons/bs';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  IconButton,
  Input,
} from '@chakra-ui/react';
import Table from '@/components/Table';
import { useDispatch, useSelector } from 'react-redux';
import { Product } from '@/prisma/customTypes';
import { AppDispatch, RootState } from '@/redux/store';
import { addProduct, deleteProductById, getProducts, updateProductById, } from '@/redux/slices/app/productApiThunks';
import { addCategory, getCategories } from '@/redux/slices/app/categoryApiThunks ';
import Form from '@/components/Form';
import SearchProduct from './common/SearchProduct';

const Products: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { items: products, loading, count, input } = useSelector((state: RootState) => state.app.product);
  const { items: categories, loading: categoriesLoading } = useSelector(
    (state: RootState) => state.app.category
  );

  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Partial<Product>>({});

  useEffect(() => {
    dispatch(getProducts(input));
    dispatch(getCategories());
  }, [dispatch]);

  const openAddModal = () => {
    setFormValues({});
    setEditingProductId(null);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setFormValues({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      categoryId: product.categoryId || product.category?.id,
      description: product.description,
    });
    setEditingProductId(product.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      dispatch(deleteProductById(id));
    }
  };

  const handleSubmit = (values: any) => {
    const payload = { ...values };
    if (editingProductId) {
      dispatch(updateProductById({ ...(payload as Product), id: editingProductId }));
    } else {
      dispatch(addProduct(payload as Product));
    }
    setShowModal(false);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const result = await dispatch(addCategory({ name: newCategoryName.trim() }));
    if (addCategory.fulfilled.match(result)) {
      dispatch(getCategories());
      setNewCategoryName('');
      setShowCategoryModal(false);
    }
  };
  const handlePaginationChange = useCallback(async (pageNumber: number, pageSize: number) => {
    console.log("pagination called")
    await dispatch(getProducts({ ...input, pageNumber, pageSize })).unwrap();
  }, [dispatch]);
  return (
    <Box p={6} bg="gray.100" minH="100vh">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold">
            Product Management
          </Heading>
          <Text color="gray.600">
            Manage product details only (ID, Name, SKU, etc)
          </Text>
        </Box>
        <Button
          colorScheme="blue"
          onClick={openAddModal}
          display="flex"
          alignItems="center"
          gap={2}
        >
          <BiPlus /> Add Product
        </Button>
      </Flex>
      <Box mb={62} display="flex" justifyContent="space-between" alignItems="center">
        <SearchProduct />
      </Box>
      {/* Product Table */}
      <Box bg="white" borderRadius="lg" shadow="md" p={0}>
        <Table onPaginationChange={handlePaginationChange} rows={products || []} columns={[
          { accessKey: 'id', label: 'Product ID', align: 'left' },
          { accessKey: 'name', label: 'Product Name', align: 'left' },
          { accessKey: 'sku', label: 'SKU', align: 'left' },
          { accessKey: 'category', label: 'Category', align: 'left', format: (_, row) => row.category?.name || '-', },
          { accessKey: 'price', label: 'Sell Price', align: 'left', format: (val) => `Rs ${val}`, },
          { accessKey: 'description', label: 'Description', align: 'left', format: (val) => val || '-', },
          {
            accessKey: 'id',
            label: 'Actions',
            align: 'left',
            format: (val, row) => (
              <Flex gap={2}>
                <IconButton
                  aria-label="Edit"
                  size="sm"
                  colorScheme="blue"
                  onClick={() => openEditModal(row)}
                >
                  <FiEdit2 />
                </IconButton>
                <IconButton
                  aria-label="Delete"
                  size="sm"
                  colorScheme="red"
                  onClick={() => handleDelete(val)}
                >
                  <BsTrash2 />
                </IconButton>
              </Flex>
            ),
          },
        ]}
          dataFetchingAsync
          loading={loading}
          totalRows={count}
          pageSize={input.pageSize}
          pageNumber={input.pageNumber}
        />
      </Box>

      {/* Product Modal (Custom) */}
      {showModal && (
        <Flex
          position="fixed"
          inset="0"
          bg="blackAlpha.600"
          justify="center"
          align="center"
          zIndex="1000"
        >
          <Box
            bg="white"
            borderRadius="xl"
            maxW="md"
            w="full"
            maxH="90vh"
            overflowY="auto"
            p={6}
          >
            <Heading fontSize="lg" mb={4}>
              {editingProductId ? 'Edit Product' : 'Add New Product'}
            </Heading>
            <Form initialValues={formValues} enableReinitialize onSubmit={handleSubmit}
              fields={[
                { type: 'text', name: 'name', label: 'Product Name', fieldArea: 12 },
                { type: 'text', name: 'sku', label: 'SKU', fieldArea: 12, notRequired: true },
                { type: 'number', name: 'price', label: 'Sell Price (Rs)', fieldArea: 12 },
                {
                  type: 'select',
                  name: 'categoryId',
                  label: 'Category',
                  fieldArea: 12,
                  options: categoriesLoading
                    ? []
                    : categories.map((c) => ({ label: c.name, value: c.id })),
                },
                { type: 'text-area', name: 'description', label: 'Description', fieldArea: 12, notRequired: true },
                { type: 'submit', name: 'submit-btn', label: editingProductId ? 'Update Product' : 'Add Product', fieldArea: 12 },
              ]}
            />
            <Button
              mt={3}
              w="full"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
          </Box>
        </Flex>
      )}

      {/* Category Modal (Custom) */}
      {showCategoryModal && (
        <Flex
          position="fixed"
          inset="0"
          bg="blackAlpha.600"
          justify="center"
          align="center"
          zIndex="1000"
        >
          <Box
            bg="white"
            borderRadius="xl"
            maxW="sm"
            w="full"
            p={6}
          >
            <Heading fontSize="lg" mb={4}>
              Add New Category
            </Heading>
            <Input
              placeholder="Enter category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              mb={3}
            />
            <Flex gap={2}>
              <Button colorScheme="blue" flex="1" onClick={handleAddCategory}>
                Add Category
              </Button>
              <Button flex="1" variant="outline" onClick={() => setShowCategoryModal(false)}>
                Cancel
              </Button>
            </Flex>
          </Box>
        </Flex>
      )}
    </Box>
  );
};

export default Products;
