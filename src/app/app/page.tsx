'use client';
import { Layout } from '@/tabs/Layout';
import React, { useState, useEffect } from 'react';
import Sales from '@/tabs/Sales';
import { getCookie } from '@/utils';
import { AUTH_TOKEN_NAME, PAGES } from '@/app-config';
import { useRouter } from 'next/navigation';
import Inventory from '@/tabs/inventoryTab';
import Product from '@/tabs/productTab';
import Order from '@/tabs/orderTab';
import Dashboard from '../../tabs/dashboard/index';
import ReturnPage from '@/tabs/Return';
import ExpenseTab from '@/tabs/ExpenseTab';
import Reports from '@/tabs/Reports';

export default function AppPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();

  useEffect(() => {
    const token = getCookie(AUTH_TOKEN_NAME);
    if (!token) {
      router.replace(PAGES.Login.path);
      return;
    }
    setLoading(false);
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
      case 'expenses': return <ExpenseTab />;
      default: return <Dashboard />;
    }
  };

  if (loading) {
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
