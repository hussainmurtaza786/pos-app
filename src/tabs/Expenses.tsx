import React, { useState, useEffect } from 'react';
// import { Download, Edit, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../helper';
import { BiDownload, BiEdit } from 'react-icons/bi';
import { BsTrash2 } from 'react-icons/bs';
// import { formatCurrency } from '../lib/currency';

type Expense = {
  id: number;
  amount: number;
  reason: string;
  category: string;
  date: string;
  receipt?: string;
};

const CATEGORIES = ['Utility', 'Salary', 'Rent', 'Loss', 'Misc'];
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8c94', '#a29bfe'];

const Expenses: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [receipt, setReceipt] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    // Alert if any expense > 5000
    const bigExpense = expenses.find(e => e.amount > 5000);
    if (bigExpense) {
      alert(`🚨 Large expense detected: ${bigExpense.reason} (${formatCurrency(bigExpense.amount)})`);
    }
  }, [expenses]);

  const handleAddExpense = () => {
    if (!amount || !reason) return;

    const newExpense: Expense = {
      id: editId || Date.now(),
      amount: parseFloat(amount),
      reason,
      category,
      date: new Date().toISOString().split('T')[0],
      receipt
    };

    if (editId) {
      setExpenses(prev => prev.map(e => (e.id === editId ? newExpense : e)));
      setEditId(null);
    } else {
      setExpenses(prev => [newExpense, ...prev]);
    }

    setAmount('');
    setReason('');
    setCategory(CATEGORIES[0]);
    setReceipt('');
  };

  const handleEdit = (id: number) => {
    const exp = expenses.find(e => e.id === id);
    if (exp) {
      setAmount(exp.amount.toString());
      setReason(exp.reason);
      setCategory(exp.category);
      setReceipt(exp.receipt || '');
      setEditId(exp.id);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleExport = () => {
    const csv = ['Amount,Reason,Category,Date,Receipt'];
    expenses.forEach(e => {
      csv.push(
        `${e.amount},"${e.reason}","${e.category}",${e.date},"${e.receipt || ''}"`
      );
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
  };

  const filteredExpenses = expenses.filter(e =>
    (filterCategory ? e.category === filterCategory : true) &&
    (search ? e.reason.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const dataForChart = CATEGORIES.map((cat, idx) => ({
    name: cat,
    value: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  }));

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Expense Manager</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <input
          type="number"
          className="border rounded px-4 py-2"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="text"
          className="border rounded px-4 py-2"
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded px-4 py-2"
        >
          {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
        </select>
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setReceipt(file.name);
          }}
        />
      </div>

      <div className="flex gap-4 items-center mt-2">
        <button onClick={handleAddExpense} className="bg-red-600 text-white px-6 py-2 rounded">
          {editId ? 'Update Expense' : 'Add Expense'}
        </button>
        <input
          type="text"
          placeholder="Search reason"
          className="border rounded px-4 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded px-4 py-2"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
        </select>
        <button onClick={handleExport} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <BiDownload size={16} /> Export CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-2">Expense History</h3>
        {filteredExpenses.length === 0 ? (
          <p className="text-gray-500">No expenses found.</p>
        ) : (
          <table className="w-full text-sm text-left mt-2 border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Amount</th>
                <th>Reason</th>
                <th>Category</th>
                <th>Date</th>
                <th>Receipt</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(e => (
                <tr key={e.id} className="border-t">
                  <td className="p-2">{formatCurrency(e.amount)}</td>
                  <td>{e.reason}</td>
                  <td>{e.category}</td>
                  <td>{e.date}</td>
                  <td>{e.receipt || '-'}</td>
                  <td className="space-x-2">
                    <button onClick={() => handleEdit(e.id)} className="text-blue-600 hover:underline text-sm">
                      <BiEdit size={14} />
                    </button>
                    <button onClick={() => handleDelete(e.id)} className="text-red-600 hover:underline text-sm">
                      <BsTrash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white p-4 rounded shadow-sm mt-4">
        <h3 className="font-semibold mb-2 text-gray-800">Expense Summary</h3>
        <p className="text-lg font-bold text-gray-800 mb-4">
          Total Expenses: {formatCurrency(totalExpense)}
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dataForChart}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {dataForChart.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Expenses;
