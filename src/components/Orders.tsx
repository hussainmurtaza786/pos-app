'use client';

import React, { useState } from 'react';
import { BiChevronDown } from 'react-icons/bi';

const dummySale = {
  id: '569397c8-946c-4ae7-a1f3-...',
  date: 'July 26, 2025',
  total: 3320,
  payment: 'CARD',
  status: 'PARTIALLY RETURNED',
  products: [
    { name: 'Sample Product 1', quantity: 2 },
    { name: 'Sample Product 2', quantity: 1 },
  ],
  cashReceived: 4000,
  changeReturned: 680,
};

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnQty, setReturnQty] = useState(dummySale.products.map(() => 0));
  const [returnReason, setReturnReason] = useState('');

  const handleReturnQtyChange = (index: number, value: number) => {
    const updated = [...returnQty];
    updated[index] = value;
    setReturnQty(updated);
  };

  const returnTotal = dummySale.products.reduce((sum, item, i) => {
    return sum + returnQty[i] * 1000; // assume Rs 1000 per item
  }, 0);

  const filtered = dummySale.id.includes(searchTerm);

  return (
    <div className="p-6">
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search sales by ID, customer name, or phone..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border rounded p-2 mb-4"
      />

      {/* Sales Receipts */}
      <h2 className="text-2xl font-bold mb-2">Sales Receipts</h2>
      {filtered && (
        <div className="bg-white shadow rounded p-4">
          <div className="grid grid-cols-6 gap-4 font-semibold text-gray-600 border-b pb-2">
            <span>SALE ID</span>
            <span>DATE</span>
            <span>TOTAL</span>
            <span>PAYMENT</span>
            <span>STATUS</span>
            <span>ACTIONS</span>
          </div>

          <div className="grid grid-cols-6 gap-4 items-center py-3 border-b text-sm">
            <span className="text-blue-600">{dummySale.id}</span>
            <span>{dummySale.date}</span>
            <span className="font-semibold">Rs {dummySale.total}</span>
            <span>{dummySale.payment}</span>
            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
              {dummySale.status}
            </span>
            <div className="flex gap-3 items-center">
              <button
                className="text-blue-600 hover:underline"
                onClick={() => setShowReturnModal(true)}
              >
                Return
              </button>
              <button
                onClick={() => setShowDetailsModal(true)}
                className="text-gray-600 hover:text-black flex items-center"
              >
                Details <BiChevronDown className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-[500px]">
            <h3 className="text-xl font-semibold mb-4">Return Products</h3>
            <table className="w-full mb-4">
              <thead>
                <tr className="text-left font-medium text-gray-700">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Quantity Sold</th>
                  <th className="pb-2">Return Qty</th>
                </tr>
              </thead>
              <tbody>
                {dummySale.products.map((item, i) => (
                  <tr key={i} className="text-sm">
                    <td className="py-2">{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={returnQty[i]}
                        onChange={(e) => handleReturnQtyChange(i, parseInt(e.target.value || '0'))}
                        className="border px-2 py-1 rounded w-20"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <textarea
              placeholder="Reason for return..."
              className="w-full border rounded p-2 mb-3"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            />

            <p className="mb-4 text-sm">
              Return Amount:{' '}
              <span className="font-semibold">Rs {returnTotal.toLocaleString()}</span>
            </p>

            <div className="flex justify-end gap-3">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setShowReturnModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={() => {
                  // Save return logic here...
                  setShowReturnModal(false);
                }}
              >
                Submit Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-[500px]">
            <h3 className="text-xl font-semibold mb-4">Sale Details</h3>
            <p className="text-sm mb-2">Sale ID: {dummySale.id}</p>
            <p className="text-sm mb-2">Date: {dummySale.date}</p>
            <ul className="list-disc pl-5 text-sm mb-3">
              {dummySale.products.map((item, i) => (
                <li key={i}>
                  {item.name} — Qty: {item.quantity}
                </li>
              ))}
            </ul>
            <p className="text-sm mb-1">Cash Received: Rs {dummySale.cashReceived}</p>
            <p className="text-sm mb-1">Change Returned: Rs {dummySale.changeReturned}</p>
            <p className="text-sm mb-3 font-semibold">Total Paid: Rs {dummySale.total}</p>
            <div className="text-right">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
