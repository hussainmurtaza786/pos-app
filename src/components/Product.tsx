'use client';

import React, { useEffect, useState } from 'react';
import { BiPlus } from 'react-icons/bi';
import { FiEdit2 } from 'react-icons/fi';
import { BsTrash2 } from 'react-icons/bs';

import { useDispatch, useSelector } from 'react-redux';
import { Product } from '@/prisma/customTypes';
import { AppDispatch, RootState } from '@/redux/store';
import {
  addProduct,
  deleteProductById,
  getProducts,
  updateProductById,
} from '@/redux/slices/app/productApiThunks';
import { addCategory, getCategories } from '@/redux/slices/app/categoryApiThunks ';

const Products: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { items: products, loading } = useSelector((state: RootState) => state.app.product);
  const { items: categories, loading: categoriesLoading } = useSelector((state: RootState) => state.app.category);

  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // ✅ Updated form state to hold categoryId directly
  const [form, setForm] = useState<{
    id?: string;
    name?: string;
    sku?: string;
    price?: number;
    description?: string;
    categoryId?: string;
  }>({});
  console.log('form', form);
  useEffect(() => {
    dispatch(getProducts({ search: '' }));
    dispatch(getCategories());
  }, [dispatch]);

  const openAddModal = () => {
    setForm({});
    setEditingProductId(null);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setForm({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      // description: product.description,
      categoryId: product.categoryId? product.categoryId : '',
    });
    setEditingProductId(product.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      dispatch(deleteProductById(id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;

    const payload = { ...form };

    if (editingProductId) {
      dispatch(updateProductById({ ...(payload as Product), id: editingProductId }));
    } else {
      dispatch(addProduct(payload as Product));
    }

    setShowModal(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const result = await dispatch(addCategory({ name: newCategoryName.trim() }));
    if (addCategory.fulfilled.match(result)) {
      dispatch(getCategories());
      setNewCategoryName('');
      setShowCategoryModal(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Product Management</h1>
          <p className="text-gray-600">Manage product details only (ID, Name, SKU, etc)</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <BiPlus className="mr-2" /> Add Product
        </button>
      </div>

      {/* Product Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Product ID</th>
              <th className="text-left px-6 py-3 font-medium">Product Name</th>
              <th className="text-left px-6 py-3 font-medium">SKU</th>
              <th className="text-left px-6 py-3 font-medium">Category</th>
              <th className="text-left px-6 py-3 font-medium">Sell Price</th>
              <th className="text-left px-6 py-3 font-medium">Description</th>
              <th className="text-left px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center p-4">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-4">No products found.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">{p.id}</td>
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className="px-6 py-4">{p.sku}</td>
                  <td className="px-6 py-4">{p.category?.name || '-'}</td>
                  <td className="px-6 py-4">Rs {p.price}</td>
                  <td className="px-6 py-4">{p.description || '-'}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button className="text-blue-600" onClick={() => openEditModal(p)}>
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button className="text-red-600" onClick={() => handleDelete(p.id)}>
                      <BsTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4">
              {editingProductId ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  value={form.sku || ''}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price (Rs) *</label>
                <input
                  type="number"
                  required
                  value={form.price || ''}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Category Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="flex gap-2">
                  <select
                    value={form.categoryId || ''}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, categoryId: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Category</option>
                    {categoriesLoading ? (
                      <option disabled>Loading...</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  {editingProductId ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Add New Category</h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Enter category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Add Category
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
