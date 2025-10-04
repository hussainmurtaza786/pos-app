'use client';
// import { Dashboard } from '@/tabs/Dashboard';
import Expenses from '@/tabs/Expenses';
import { Layout } from '@/tabs/Layout';
import { Reports } from '@/tabs/Reports';
// import Returns from '@/tabs/Return';
import React, { useState, useEffect } from 'react';
import Sales from '@/tabs/Sales';
import { getCookie } from '@/utils';
import { AUTH_TOKEN_NAME, PAGES } from '@/app-config';
import { useRouter } from 'next/navigation';
import Inventory from '@/tabs/inventoryTab';
import Product from '@/tabs/productTab';
import Order from '@/tabs/orderTab';
import Dashboard from '../tabs/dashboard/index';
import ReturnPage from '@/tabs/Return';
function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();

  useEffect(() => {
    const token = getCookie(AUTH_TOKEN_NAME);

    if (!token) {
      router.replace(PAGES.Login.path); // Redirect to login
      return;
    }

    setLoading(false); // Token exists, allow dashboard
  }, [router]);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'sales': return <Sales />;
      case 'orders': return <Order />;
      case 'products': return <Product />;
      case 'returns': return <ReturnPage />;
      case 'inventory': return <Inventory />;
      case 'reports': return <Reports />;
      case 'expenses': return <Expenses />;
      default: return <Dashboard />;
    }
  };

  if (loading) {
    // Loader while checking token
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onSignOut={() => router.push(PAGES.Login.path)}>
      {renderActiveComponent()}
    </Layout>
  );
}

export default App;
