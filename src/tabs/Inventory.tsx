'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { addInventory, getInventories, updateInventoryById, deleteInventoryById, } from '@/redux/slices/app/inventoryApiThunks';
import { BiCheckCircle, BiPackage, BiPlus } from 'react-icons/bi';
import { FiAlertTriangle } from 'react-icons/fi';

const Spinner = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const InventoryPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: inventory, loading } = useSelector((state: RootState) => state.app.inventory);

  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    description: '',
    quantity: 0,
    purchasePrice: 0,
  });

  const [editMode, setEditMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  useEffect(() => {
    dispatch(getInventories({}));
  }, [dispatch]);

  const resetForm = () => {
    setFormData({
      productId: '',
      name: '',
      description: '',
      quantity: 0,
      purchasePrice: 0,
    });
    setFormMessage(null);
  };

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-600' };
    if (qty <= 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-600' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-600' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);

    if (!formData.productId) {
      setFormMessage('Please enter a valid product ID.');
      return;
    }

    const payload = {
      productId: formData.productId,
      name: formData.name,
      description: formData.description,
      quantity: formData.quantity,
      purchasePrice: formData.purchasePrice,
    };

    try {
      if (editMode) {
        await dispatch(
          updateInventoryById({
            id: (formData as any).id,
            ...payload,
            purchasedQuantity: formData.quantity,
            availableQuantity: formData.quantity,
          })
        );
      } else {
        await dispatch(addInventory(payload));
      }

      setFormMessage('Inventory saved successfully.');
      resetForm();
      setEditMode(false);
      setShowModal(false);
    } catch (error: any) {
      console.error('Submit Error:', error);
      setFormMessage('An error occurred while saving. Please try again.');
    }
  };

  const handleEdit = (item: any) => {
    setFormData({
      ...(item as any),
      quantity: item.purchasedQuantity,
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    await dispatch(deleteInventoryById(id));
  };

  if (loading && !showModal) return <Spinner />;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-gray-600">Manage your inventory and stock</p>
        </div>
        <button
          onClick={() => {
            setEditMode(false);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <BiPlus className="mr-2" /> Add Inventory
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: 'In Stock',
            count: inventory.filter((i) => i.availableQuantity > 10).length,
            icon: <BiCheckCircle />,
            color: 'bg-green-100 text-green-600',
          },
          {
            label: 'Low Stock',
            count: inventory.filter((i) => i.availableQuantity <= 10 && i.availableQuantity > 0).length,
            icon: <BiPackage />,
            color: 'bg-yellow-100 text-yellow-600',
          },
          {
            label: 'Out of Stock',
            count: inventory.filter((i) => i.availableQuantity === 0).length,
            icon: <FiAlertTriangle />,
            color: 'bg-red-100 text-red-600',
          },
        ].map(({ label, count, icon, color }) => (
          <div key={label} className="bg-white p-4 rounded-lg flex items-center shadow">
            <div className={`p-2 mr-4 rounded-full ${color}`}>{icon}</div>
            <div>
              <p className="text-lg font-semibold">{count}</p>
              <p className="text-sm">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">Name & Id</th>
              <th className="px-6 py-3 text-left">Purchased Qty</th>
              <th className="px-6 py-3 text-left">Available Qty</th>
              <th className="px-6 py-3 text-left">Price</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => {
              const status = getStockStatus(item.availableQuantity);
              return (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">{item.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.product?.sku || item.productId}</div>
                  </td>
                  <td className="px-6 py-4">{item.purchasedQuantity}</td>
                  <td className="px-6 py-4">{item.availableQuantity}</td>
                  <td className="px-6 py-4">Rs {item.purchasePrice.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline" disabled={loading}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline" disabled={loading}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editMode ? 'Edit' : 'Add'} Inventory</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product ID</label>
                <input
                  type="text"
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter Product ID"
                />
              </div>
              <label className="block text-sm font-medium mb-1">Name</label>

              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Name"
              />
              <label className="block text-sm font-medium mb-1">Description</label>

              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Description"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: +e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Purchased Quantity"
                  />
                </div>
                <div className=''>
                  <label className="block text-sm font-medium mb-1">Purchase Price</label>

                  <input
                    type="number"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: +e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Cost Price"
                  />
                </div>
              </div>

              {formMessage && (
                <p className="text-sm text-center text-blue-600">{formMessage}</p>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editMode ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
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

export default InventoryPage;
