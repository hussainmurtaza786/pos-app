'use client';
import React, { useState } from 'react';
import { BiPlus } from 'react-icons/bi';
import { FiEdit2 } from 'react-icons/fi';
import { BsTrash2 } from 'react-icons/bs';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  purchaseQty: number;
  availableQty: number;
  description?: string;
  sku?: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Chocolate Chips',
      category: 'Chocolates',
      price: 100,
      purchaseQty: 50,
      availableQty: 40,
      sku: 'choco-1',
      description: 'Sweet chips',
    },
    {
      id: '2',
      name: 'Phone',
      category: 'Phones',
      price: 1000,
      purchaseQty: 50,
      availableQty: 42,
      sku: 'p1',
      description: 'Smartphone',
    },
  ]);

  const [categories, setCategories] = useState<string[]>(['Chocolates', 'Phones']);
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>({
    name: '',
    category: '',
    price: 0,
    purchaseQty: 0,
    availableQty: 0,
    description: '',
    sku: '',
  });

  const openAddModal = () => {
    setForm({
      name: '',
      category: '',
      price: 0,
      purchaseQty: 0,
      availableQty: 0,
      description: '',
      sku: '',
    });
    setEditingProductId(null);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    const { id, ...rest } = product;
    setForm({ ...rest });
    setEditingProductId(id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      ...form,
      id: editingProductId ?? Date.now().toString(),
    };

    if (editingProductId) {
      setProducts((prev) => prev.map((p) => (p.id === editingProductId ? newProduct : p)));
    } else {
      setProducts((prev) => [...prev, newProduct]);
    }

    setShowModal(false);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
    }
    setNewCategory('');
    setShowCategoryModal(false);
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
            {products.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4">{p.id}</td>
                <td className="px-6 py-4 font-medium">{p.name}</td>
                <td className="px-6 py-4">{p.sku}</td>
                <td className="px-6 py-4">{p.category}</td>
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4">
              {editingProductId ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price (Rs) *</label>
                <input
                  type="number"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="flex gap-2">
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
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

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Add New Category</h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Enter category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
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
