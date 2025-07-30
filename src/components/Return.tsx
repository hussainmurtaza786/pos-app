import { useState } from "react";

const ReturnsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [returnQty, setReturnQty] = useState(0);
  const [maxQty, setMaxQty] = useState(4); // example max quantity
  const [reason, setReason] = useState("");

  const returnAmount = returnQty * 1000; // assuming price is 1000

  return (
    <div className="p-6">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search sales by ID, customer name, or phone..."
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
        />
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">Sales Receipts</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 text-sm">
              <th className="py-2">SALE ID</th>
              <th className="py-2">DATE</th>
              <th className="py-2">CUSTOMER</th>
              <th className="py-2">TOTAL</th>
              <th className="py-2">PAYMENT</th>
              <th className="py-2">STATUS</th>
              <th className="py-2">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-blue-600 font-medium">41a49a54-ae8a-41ae-a86e-341acc2049ae</td>
              <td className="text-gray-700">7/26/2025</td>
              <td>Walk-in Customer</td>
              <td className="font-bold">Rs 4,320.00</td>
              <td className="text-sm">CARD</td>
              <td>
                <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                  PARTIALLY RETURNED
                </span>
              </td>
              <td>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  &#8635; Return
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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
            <tr>
              <td className="text-blue-600 font-medium">07eb5f82-dcee-4463-8e9f-bbf7b1fafed7</td>
              <td>41a49a54-ae8a-41ae-a86e-341acc2049ae</td>
              <td>7/26/2025</td>
              <td>
                <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full">
                  PARTIAL
                </span>
              </td>
              <td className="text-red-600 font-semibold">-Rs 1,000.00</td>
              <td>dont want</td>
            </tr>
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Process Return - 41a49a54-ae8a-41ae-a86e-341acc2049ae
            </h3>
            <div className="mb-4">
              <p className="font-medium mb-1">Items to Return</p>
              <div className="flex justify-between items-center border p-3 rounded">
                <div>
                  <p>i-phones</p>
                  <p className="text-sm text-gray-500">Original: {maxQty} × Rs 1,000.00</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={maxQty}
                  value={returnQty}
                  onChange={(e) =>
                    setReturnQty(Math.min(Number(e.target.value), maxQty))
                  }
                  className="w-20 text-right border border-gray-300 rounded p-1"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Reason for Return</label>
              <textarea
                className="w-full p-2 border rounded"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="mb-4 text-right font-semibold">
              Return Amount: Rs {returnAmount.toLocaleString("en-PK")}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                disabled={!returnQty || !reason}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700"
              >
                Process Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsPage;
