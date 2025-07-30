import React, { useState, useEffect } from 'react';
import { BiShoppingBag, BiTrendingUp, BiUserPlus } from 'react-icons/bi';
import { FaDollarSign } from 'react-icons/fa';
import { FiAlertTriangle } from 'react-icons/fi';

const formatCurrency = (amount: number) => {
  return `Rs ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

interface DashboardStats {
  todaysSales: number;
  todaysProfit: number;
  monthlySales: number;
  monthlyProfit: number;
  yearlySales: number;
  yearlyProfit: number;
  totalTransactions: number;
  avgTransaction: number;
  todaysReturns: number;
  monthlyReturns: number;
  yearlyReturns: number;
  todaysReturnsProfit: number;
  monthlyReturnsProfit: number;
  yearlyReturnsProfit: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todaysSales: 3000,
    todaysProfit: 1230,
    monthlySales: 9400,
    monthlyProfit: 3810,
    yearlySales: 9400,
    yearlyProfit: 3810,
    totalTransactions: 7,
    avgTransaction: 750,
    todaysReturns: 0,
    monthlyReturns: 1000,
    yearlyReturns: 1000,
    todaysReturnsProfit: 0,
    monthlyReturnsProfit: 400,
    yearlyReturnsProfit: 400,
  });

  const StatCard: React.FC<{
    title: string;
    value: number;
    returns?: number;
    icon: React.ElementType;
    color: string;
  }> = ({ title, value, returns = 0, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(value - returns)}
          </p>
          {returns > 0 && (
            <p className="text-xs text-red-600 mt-1">
              Returns: -{formatCurrency(returns)}
            </p>
          )}
        </div>
        <div className={`p-3 ${color} rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
          Sales Dashboard
        </h1>
        <p className="text-gray-600">
          Track your sales performance and profits (net of returns)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title="Today's Sales" value={stats.todaysSales} returns={stats.todaysReturns} icon={FaDollarSign} color="bg-blue-600" />
        <StatCard title="Today's Profit" value={stats.todaysProfit} returns={stats.todaysReturnsProfit} icon={BiTrendingUp} color="bg-green-600" />
        <StatCard title="Monthly Sales" value={stats.monthlySales} returns={stats.monthlyReturns} icon={BiShoppingBag} color="bg-purple-600" />
        <StatCard title="Monthly Profit" value={stats.monthlyProfit} returns={stats.monthlyReturnsProfit} icon={BiTrendingUp} color="bg-green-600" />
        <StatCard title="Yearly Sales" value={stats.yearlySales} returns={stats.yearlyReturns} icon={BiShoppingBag} color="bg-orange-600" />
        <StatCard title="Yearly Profit" value={stats.yearlyProfit} returns={stats.yearlyReturnsProfit} icon={BiTrendingUp} color="bg-green-600" />
        <StatCard title="Total Transactions" value={stats.totalTransactions} icon={BiUserPlus} color="bg-blue-600" />
        <StatCard title="Average Transaction" value={stats.avgTransaction} icon={FaDollarSign} color="bg-blue-600" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">
          Quick Overview (Net of Returns)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="text-center">
            <p className="text-2xl lg:text-3xl font-bold text-blue-600">
              {formatCurrency(stats.todaysSales - stats.todaysReturns)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Today's Net Sales</p>
          </div>
          <div className="text-center">
            <p className="text-2xl lg:text-3xl font-bold text-green-600">
              {formatCurrency(stats.todaysProfit - stats.todaysReturnsProfit)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Today's Net Profit</p>
          </div>
          <div className="text-center">
            <p className="text-2xl lg:text-3xl font-bold text-purple-600">
              {stats.totalTransactions}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Transactions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl lg:text-3xl font-bold text-orange-600">
              {formatCurrency(stats.avgTransaction)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Avg Transaction (Net)
            </p>
          </div>
        </div>
      </div>

      {(stats.todaysReturns > 0 ||
        stats.monthlyReturns > 0 ||
        stats.yearlyReturns > 0) && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
          <div className="flex items-start">
            <FiAlertTriangle className="h-6 w-6 text-red-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Returns Impact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xl lg:text-2xl font-bold text-red-600">
                    {formatCurrency(stats.todaysReturns)}
                  </p>
                  <p className="text-sm text-red-700">Today's Returns</p>
                </div>
                <div className="text-center">
                  <p className="text-xl lg:text-2xl font-bold text-red-600">
                    {formatCurrency(stats.monthlyReturns)}
                  </p>
                  <p className="text-sm text-red-700">Monthly Returns</p>
                </div>
                <div className="text-center">
                  <p className="text-xl lg:text-2xl font-bold text-red-600">
                    {formatCurrency(stats.yearlyReturns)}
                  </p>
                  <p className="text-sm text-red-700">Yearly Returns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
