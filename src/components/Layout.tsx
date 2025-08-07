import { logout } from '@/redux/slices/auth';
import React, { useState } from 'react';
import { CiLogout } from 'react-icons/ci';
import { FaChartBar, FaFileInvoice, FaMoneyBillWave } from "react-icons/fa";
import { FiFileText, FiRotateCcw } from 'react-icons/fi';
import { GoPackage } from 'react-icons/go';
import { HiOutlineCube } from 'react-icons/hi';
import { IoIosTrendingUp } from 'react-icons/io';
import { useDispatch } from 'react-redux';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onSignOut: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onSignOut }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const dispatch = useDispatch()
    const handleSignOut = async () => {
        localStorage.removeItem('token');
        dispatch(logout());
        onSignOut();
    };

    const navigation = [
        { id: 'dashboard', label: 'Dashboard', icon: FaChartBar },
        { id: 'sales', label: 'Sales', icon: FaFileInvoice },
        { id: 'orders', label: 'Orders', icon: FaFileInvoice },
        { id: 'expenses', label: 'Expenses', icon: FaMoneyBillWave },
        { id: 'inventory', label: 'Inventory', icon: HiOutlineCube },
        { id: 'products', label: 'Product', icon: GoPackage },
        { id: 'returns', label: 'Returns', icon: FiRotateCcw },
        { id: 'reports', label: 'Reports', icon: FiFileText },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex relative">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-sm border-r border-gray-200 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <IoIosTrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">POS System</h1>
                    </div>
                </div>

                <nav className="mt-6 px-3">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg mb-1 transition-colors ${activeTab === item.id
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className="h-5 w-5 mr-3" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="absolute bottom-6 left-3 right-3">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                    >
                        <CiLogout className="h-5 w-5 mr-3" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex-1 overflow-hidden lg:ml-0">
                {/* Mobile header */}
                <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-blue-600 rounded-lg">
                            <IoIosTrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-lg font-bold text-gray-900">POS System</h1>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
};