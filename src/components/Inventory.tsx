'use client';
import React, { useState } from 'react';
import { BiCheckCircle, BiPackage, BiPlus } from 'react-icons/bi';
import { FiAlertTriangle } from 'react-icons/fi';

interface InventoryItem {
  id: string;
  name: string;
  purchaseQty: number;
  availableQty: number;
  costPrice: number;
}

interface Product {
  id: string;
  name: string;
}

const Inventory: React.FC = () => {
  const productOptions: Product[] = [
    { id: '1', name: 'Chocolate Chips' },
    { id: '2', name: 'Phone' },
    { id: '3', name: 'Shampoo' },
  ];

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    productId: '',
    purchaseQty: 0,
    availableQty: 0,
    costPrice: 0,
  });

  const getProductName = (id: string) => {
    const found = productOptions.find((p) => p.id === id);
    return found?.name ?? '';
  };

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-600' };
    if (qty <= 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-600' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-600' };
  };

  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId) return;

    const newItem: InventoryItem = {
      id: form.productId,
      name: getProductName(form.productId),
      purchaseQty: form.purchaseQty,
      availableQty: form.availableQty,
      costPrice: form.costPrice,
    };

    setInventory((prev) => [...prev, newItem]);
    setForm({ productId: '', purchaseQty: 0, availableQty: 0, costPrice: 0 });
    setShowModal(false);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-gray-600">Manage your product inventory and stock levels</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <BiPlus className="mr-2" /> Add Inventory
        </button>
      </div>

      {/* Stock Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'In Stock', count: inventory.filter(p => p.availableQty > 10).length, icon: <BiCheckCircle />, color: 'text-green-600 bg-green-100' },
          { label: 'Low Stock', count: inventory.filter(p => p.availableQty <= 10 && p.availableQty > 0).length, icon: <BiPackage />, color: 'text-yellow-600 bg-yellow-100' },
          { label: 'Out of Stock', count: inventory.filter(p => p.availableQty === 0).length, icon: <FiAlertTriangle />, color: 'text-red-600 bg-red-100' },
        ].map((status) => (
          <div key={status.label} className="bg-white flex items-center p-4 shadow rounded-lg">
            <div className={`p-2 rounded-full mr-4 ${status.color}`}>{status.icon}</div>
            <div>
              <p className="text-lg font-semibold">{status.count}</p>
              <p className="text-sm text-gray-600">{status.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Inventory ID</th>
              <th className="text-left px-6 py-3 font-medium">Product Name</th>
              <th className="text-left px-6 py-3 font-medium">Purchase Qty</th>
              <th className="text-left px-6 py-3 font-medium">Available Qty</th>
              <th className="text-left px-6 py-3 font-medium">Cost Price</th>
              <th className="text-left px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => {
              const status = getStockStatus(item.availableQty);
              return (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">{item.id}</td>
                  <td className="px-6 py-4">{item.name}</td>
                  <td className="px-6 py-4">{item.purchaseQty}</td>
                  <td className="px-6 py-4">{item.availableQty}</td>
                  <td className="px-6 py-4">Rs {item.costPrice.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Inventory Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add Inventory</h2>
            <form onSubmit={handleAddInventory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Product *</label>
                <select
                  required
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">-- Select --</option>
                  {productOptions.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price *</label>
                <input
                  type="number"
                  required
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Qty *</label>
                  <input
                    type="number"
                    required
                    value={form.purchaseQty}
                    onChange={(e) => setForm({ ...form, purchaseQty: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Qty *</label>
                  <input
                    type="number"
                    required
                    value={form.availableQty}
                    onChange={(e) => setForm({ ...form, availableQty: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Inventory
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
    </div>
  );
};

export default Inventory;
