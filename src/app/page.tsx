'use client';
import { Layout } from '@/components/Layout';
import { LoginForm } from '@/components/LoginForm';
import React, { useState, useEffect } from 'react';

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
        return <div>Dashboard</div>;
      case 'order':
        return <div>Orders</div>;
      case 'inventory':
        return <div>Inventory</div>;
      case 'returns':
        return <div>Returns</div>;
      case 'product':
        return <div>Product</div>;
      case 'reports':
        return <div>Reports</div>;
      case 'expenses':
        return <div>Expenses</div>;
      default:
        return <div>Dashboard</div>;
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
