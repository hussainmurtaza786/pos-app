'use client';

import { useState } from 'react';

const dummyReturns = [
  {
    returnId: '07eb5f82-dcee-4463-8e9f-bbf7b1fafed7',
    originalSaleId: '41a49a54-ae8a-41ae-a86e-341acc2049ae',
    date: '7/26/2025',
    type: 'PARTIAL',
    amount: 1000,
    reason: 'dont want',
  },
  // Add more dummy returns here if needed
];

const ReturnsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReturns = dummyReturns.filter(
    (r) =>
      r.returnId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.originalSaleId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search returns by ID or original sale ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
        />
      </div>

      {/* Returns History */}
      <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-xl font-bold mb-2">Returns History</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 text-sm">
              <th className="py-2">RETURN ID</th>
              <th className="py-2">ORIGINAL SALE</th>
              <th className="py-2">DATE</th>
              <th className="py-2">TYPE</th>
              <th className="py-2">AMOUNT</th>
              <th className="py-2">REASON</th>
            </tr>
          </thead>
          <tbody>
            {filteredReturns.map((ret) => (
              <tr key={ret.returnId} className="text-sm">
                <td className="text-blue-600 font-medium">{ret.returnId}</td>
                <td>{ret.originalSaleId}</td>
                <td>{ret.date}</td>
                <td>
                  <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full">
                    {ret.type}
                  </span>
                </td>
                <td className="text-red-600 font-semibold">-Rs {ret.amount.toLocaleString()}</td>
                <td>{ret.reason}</td>
              </tr>
            ))}
            {filteredReturns.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  No matching return records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReturnsPage;
