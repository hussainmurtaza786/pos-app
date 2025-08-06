'use client'
import { Dashboard } from '@/components/Dashboard';
import Expenses from '@/components/Expenses';
// import Expenses from '@/components/Expenses';
// import { Inventory } from '@/components/Inventory';

import { Layout } from '@/components/Layout';
import { LoginForm } from '@/components/LoginForm';
import OrdersPage from '@/components/Sales';
import Orders from '@/components/Orders';
import { Reports } from '@/components/Reports';
import Returns from '@/components/Return';
// import { Returns } from '@/components/Return';
import React, { useState, useEffect } from 'react';
import Sales from '@/components/Sales';
import Products from '@/components/Product';
import Inventory from '@/components/Inventory';

function App() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {

    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'sales':
        return <Sales />
      case 'orders':
        return <Orders />
      case 'products':
        return <Products />
      case 'returns':
        return <Returns />
      case 'inventory':
        return <Inventory />
      case 'reports':
        return <Reports />
      case 'expenses':
        return <Expenses />
      default:
        return <Dashboard />

    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onSignOut={() => setIsLoggedIn(false)}>
      {renderActiveComponent()}
    </Layout>

  );
}

export default App;
