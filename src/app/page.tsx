'use client'
import { Inventory } from '@/components/Inventory';
import { Layout } from '@/components/Layout';
import { Reports } from '@/components/Reports';
import { Returns } from '@/components/Return';
import React, { useState, useEffect } from 'react';
// import { User } from '@supabase/supabase-js';
// import { LoginForm } from './components/LoginForm';
// import { Layout } from './components/Layout';
// import { Dashboard } from './components/Dashboard';
// import { Sales } from './components/Sales';
// import { Inventory } from './components/Inventory';
// import { Returns } from './components/Returns';
// import { Reports } from './components/Reports';
// import { onAuthStateChange } from './lib/auth';

interface User {
  gmail: string
  password: string
}
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const { data: authListener } = onAuthStateChange((user) => {
  //     setUser(user);
  //     setLoading(false);
  //   });

  //   return () => {
  //     authListener?.subscription?.unsubscribe();
  //   };
  // }, []);

  const handleLogin = () => {
    // User state will be updated by the auth listener
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <div> Dashboard </div>
      case 'order':
        return <div> Orders </div>;
      case 'inventory':
        return <Inventory />
      case 'returns':
        return <Returns />
      case 'product':
        return <div> Product </div>
      case 'reports':
        return <Reports />
      case 'expenses':
        return <div> Expenses </div>
      default:
        return <div> Dashboard </div>
    }
  };

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gray-100 flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   return <LoginForm onLogin={handleLogin} />;
  // }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderActiveComponent()}
    </Layout>
  );
}

export default App;