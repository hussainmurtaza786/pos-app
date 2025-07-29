import React, { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabase';
import { BiMinus, BiPlus, BiSearch } from 'react-icons/bi';
import { FiRotateCcw } from 'react-icons/fi';
import { formatCurrency } from '../../helper';

interface Sale {
  id: string;
  sale_number: string;
  total_amount: number;
  payment_method: string;
  cash_received: number;
  change_returned: number;
  created_at: string;
  sale_items: {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    unit_cost: number;
    products: {
      name: string;
    };
  }[];
}

interface ReturnItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  unit_cost: number;
  available_quantity: number;
  return_quantity: number;
}

interface ProcessedReturn {
  id: string;
  sale_id: string;
  return_type: string;
  reason: string;
  total_refund: number;
  created_at: string;
  sales: {
    sale_number: string;
  };
}

export const Returns: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [returns, setReturns] = useState<ProcessedReturn[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnType, setReturnType] = useState<'partial' | 'full'>('partial');
  const [returnReason, setReturnReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchReturns();
  }, []);

  const fetchSales = async () => {
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) return;

    // const { data, error } = await supabase
    //   .from('sales')
    //   .select(`
    //     *,
    //     sale_items (
    //       *,
    //       products(name)
    //     )
    //   `)
    //   .eq('user_id', user.id)
    //   .eq('status', 'completed')
    //   .order('created_at', { ascending: false });

    // if (!error) setSales(data || []);
  };

  const fetchReturns = async () => {
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) return;

    // const { data, error } = await supabase
    //   .from('returns')
    //   .select(`
    //     *,
    //     sales(sale_number)
    //   `)
    //   .eq('user_id', user.id)
    //   .order('created_at', { ascending: false });

    // if (!error) setReturns(data || []);
  };

  const filteredSales = sales.filter(sale =>
    sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.sale_items.some(item =>
      item.products.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const selectSale = (sale: Sale) => {
    setSelectedSale(sale);
    setReturnItems(sale.sale_items.map(item => ({
      product_id: item.product_id,
      product_name: item.products.name,
      unit_price: item.unit_price,
      unit_cost: item.unit_cost,
      available_quantity: item.quantity,
      return_quantity: 0
    })));
    setReturnType('partial');
    setReturnReason('');
  };

  const updateReturnQuantity = (productId: string, change: number) => {
    setReturnItems(items =>
      items.map(item =>
        item.product_id === productId
          ? { ...item, return_quantity: Math.max(0, Math.min(item.available_quantity, item.return_quantity + change)) }
          : item
      )
    );
  };

  const setFullReturn = () => {
    setReturnType('full');
    setReturnItems(items =>
      items.map(item => ({ ...item, return_quantity: item.available_quantity }))
    );
  };

  const processReturn = async () => {
    if (!selectedSale) return;

    const returningItems = returnItems.filter(item => item.return_quantity > 0);
    if (returningItems.length === 0) {
      alert('Please select items to return');
      return;
    }
    if (!returnReason.trim()) {
      alert('Please provide a reason for the return');
      return;
    }

    setLoading(true);

    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) return;

    const totalRefund = returningItems.reduce(
      (sum, item) => sum + item.unit_price * item.return_quantity,
      0
    );

    const totalProfit = returningItems.reduce(
      (sum, item) => sum + (item.unit_price - item.unit_cost) * item.return_quantity,
      0
    );

    // const { error: insertError } = await supabase
    //   .from('returns')
    //   .insert({
    //     sale_id: selectedSale.id,
    //     user_id: user.id,
    //     return_type: returnType,
    //     reason: returnReason,
    //     total_refund: totalRefund,
    //     total_profit: totalProfit,
    //     items: returningItems
    //   });

    // if (!insertError) {
    //   for (const item of returningItems) {
    //     const { data: product } = await supabase
    //       .from('products')
    //       .select('stock_quantity')
    //       .eq('id', item.product_id)
    //       .single();

    //     if (product) {
    //       await supabase
    //         .from('products')
    //         .update({
    //           stock_quantity: product.stock_quantity + item.return_quantity,
    //           updated_at: new Date().toISOString()
    //         })
    //         .eq('id', item.product_id);
    //     }
    //   }

    //   alert('Return processed successfully!');
    //   setSelectedSale(null);
    //   fetchReturns();
    // } else {
    //   alert('Failed to process return');
    // }

    setLoading(false);
  };

  const getTotalRefund = () => {
    return returnItems
      .filter(item => item.return_quantity > 0)
      .reduce((sum, item) => sum + item.unit_price * item.return_quantity, 0);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Returns Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Find Sale */}
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-3">
            <BiSearch className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold">Find Sale</h3>
          </div>
          <input
            type="text"
            placeholder="Search sale ID or product..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full mb-4 border px-3 py-2 rounded"
          />
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {filteredSales.map(sale => (
              <div
                key={sale.id}
                className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                onClick={() => selectSale(sale)}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">Sale #{sale.sale_number}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(sale.created_at).toLocaleString()} • {sale.payment_method}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {sale.sale_items.length} item(s) available to return
                    </p>
                  </div>
                  <div className="font-semibold">
                    {formatCurrency(sale.total_amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Process Return */}
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-3">
            <FiRotateCcw className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Process Return</h3>
          </div>

          {selectedSale ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-semibold">Sale #: {selectedSale.sale_number}</p>
                <p>Date: {new Date(selectedSale.created_at).toLocaleString()}</p>
                <p>Payment: {selectedSale.payment_method}</p>
                <p>Cash Received: {formatCurrency(selectedSale.cash_received)}</p>
                <p>Change Returned: {formatCurrency(selectedSale.change_returned)}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setReturnType('partial')} className={`px-3 py-1 rounded ${returnType === 'partial' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
                  Partial Return
                </button>
                <button onClick={setFullReturn} className={`px-3 py-1 rounded ${returnType === 'full' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
                  Full Return
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {returnItems.map(item => (
                  <div key={item.product_id} className="flex justify-between items-center border p-2 rounded">
                    <div>
                      <p>{item.product_name}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(item.unit_price)} • Max: {item.available_quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateReturnQuantity(item.product_id, -1)}><BiMinus size={16} /></button>
                      <span>{item.return_quantity}</span>
                      <button onClick={() => updateReturnQuantity(item.product_id, 1)}><BiPlus size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <textarea
                placeholder="Reason for return..."
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />

              <div className="flex justify-between items-center">
                <span className="font-medium">Total Refund:</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(getTotalRefund())}
                </span>
              </div>

              <button
                onClick={processReturn}
                disabled={loading || getTotalRefund() === 0}
                className="w-full bg-red-600 text-white py-2 rounded disabled:opacity-50"
              >
                {loading ? 'Processing...' : `Process Return (${returnItems.filter(i => i.return_quantity > 0).length} items - ${formatCurrency(getTotalRefund())})`}
              </button>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">Select a sale from the left to process a return</p>
          )}
        </div>
      </div>

      {/* Recent Returns */}
      <div className="bg-white p-5 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Returns</h3>
        {returns.length > 0 ? (
          <div className="space-y-3">
            {returns.map(ret => (
              <div key={ret.id} className="border p-3 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Sale {ret.sales.sale_number}</p>
                    <p className="text-sm text-gray-600">Returned: {new Date(ret.created_at).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Reason: {ret.reason}</p>
                    <p className="text-sm text-gray-600">
                      Type: <span className={`text-xs px-2 py-1 rounded ${ret.return_type === 'full' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>{ret.return_type === 'full' ? 'Full Return' : 'Partial Return'}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{formatCurrency(ret.total_refund)}</p>
                    <p className="text-sm text-red-600">Refunded</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No returns found</p>
        )}
      </div>
    </div>
  );
};


