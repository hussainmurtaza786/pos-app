'use client'
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../helper';
import { BiCheckCircle, BiPackage, BiPlus, BiSearch } from 'react-icons/bi';
import { FiAlertTriangle, FiEdit2 } from 'react-icons/fi';
import { BsTrash2 } from 'react-icons/bs';
import createInventoryItem, { deleteInventoryItem, updateInventoryItem } from '@/redux/thunks/inventoryApiThunk';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/redux/store';

interface Product {
    id: string;
    name: string;
    description: string;
    cost: number;
    price: number;
    sku: string;
    quantity: number;
    category_id: string;
    category?: { name: string };
}

interface Category {
    id: string;
    name: string;
}

export const Inventory: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(false);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryLoading, setCategoryLoading] = useState(false);

    const dispatch = useDispatch<AppDispatch>();
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        cost: '',
        price: '',
        sku: '',
        quantity: '',
        category_id: '',
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            // const { data: { user } } = await supabase.auth.getUser();
            // if (!user) return;

            // const { data, error } = await supabase
            //   .from('products')
            //   .select(`
            //     *,
            //     category:categories(name)
            //   `)
            //   .eq('user_id', user.id)
            //   .order('created_at', { ascending: false });

            // if (error) throw error;
            // setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            // if (error instanceof Error && error.message.includes('Supabase configuration')) {
            //   alert('Please connect to Supabase first by clicking the "Connect to Supabase" button in the top right corner.');
            // }
        }
    };
    const handleAddProduct = async (data: any) => {
        await dispatch(createInventoryItem(data));
        setShowAddModal(false);
    };

    //   const handleUpdateProduct = async (updatedData: any) => {
    //     if (!editingItem) return;
    //     await dispatch(updateInventoryItem({ id: editingItem.id, data: updatedData }));
    //     setShowEditModal(false);
    //     setEditingItem(null);
    //   };
    const fetchCategories = async () => {
        try {
            // const { data: { user } } = await supabase.auth.getUser();
            // if (!user) return;

            // const { data, error } = await supabase
            //   .from('categories')
            //   .select('*')
            //   .eq('user_id', user.id)
            //   .order('name');

            // if (error) throw error;
            // setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // const { data: { user } } = await supabase.auth.getUser();
            // if (!user) return;

            const productData = {
                name: productForm.name,
                description: productForm.description,
                cost: parseFloat(productForm.cost),
                price: parseFloat(productForm.price),
                sku: productForm.sku,
                quantity: parseInt(productForm.quantity),
                category_id: productForm.category_id || null,
                // user_id: user.id,
                updated_at: new Date().toISOString(),
            };

            // if (editingProduct) {
            //   const { error } = await supabase
            //     .from('products')
            //     .update(productData)
            //     .eq('id', editingProduct.id);

            //   if (error) throw error;
            // } else {
            //   const { error } = await supabase
            //     .from('products')
            //     .insert(productData);

            //   if (error) throw error;
            // }

            // resetForm();
            // fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            await dispatch(deleteInventoryItem(id));
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        setCategoryLoading(true);
        try {
            // const { data: { user } } = await supabase.auth.getUser();
            // if (!user) return;

            // const { error } = await supabase
            //   .from('categories')
            //   .insert({
            //     name: newCategoryName.trim(),
            //     user_id: user.id,
            //   });

            // if (error) throw error;

            setNewCategoryName('');
            setShowAddCategoryModal(false);
            // fetchCategories();
        } catch (error) {
            console.error('Error adding category:', error);
            alert('Failed to add category');
        } finally {
            setCategoryLoading(false);
        }
    };

    const resetForm = () => {
        setProductForm({
            name: '',
            description: '',
            cost: '',
            price: '',
            sku: '',
            quantity: '',
            category_id: '',
        });
        setEditingProduct(null);
        setShowAddModal(false);
    };

    const startEdit = (product: Product) => {
        setProductForm({
            name: product.name,
            description: product.description,
            cost: product.cost.toString(),
            price: product.price.toString(),
            sku: product.sku,
            quantity: product.quantity.toString(),
            category_id: product.category_id || '',
        });
        setEditingProduct(product);
        setShowAddModal(true);
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
            selectedCategory === 'all' || product.category_id === selectedCategory;

        let matchesStock = true;
        if (stockFilter === 'in-stock') {
            matchesStock = product.quantity > 10;
        } else if (stockFilter === 'low-stock') {
            matchesStock = product.quantity > 0 && product.quantity <= 10;
        } else if (stockFilter === 'out-of-stock') {
            matchesStock = product.quantity === 0;
        }

        return matchesSearch && matchesCategory && matchesStock;
    });

    const getStockStatus = (quantity: number) => {
        if (quantity === 0)
            return { label: 'Out of Stock', color: 'text-red-600 bg-red-100' };
        if (quantity <= 10)
            return { label: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
        return { label: 'In Stock', color: 'text-green-600 bg-green-100' };
    };

    const inStockCount = products.filter(p => p.quantity > 10).length;
    const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;
    const outOfStockCount = products.filter(p => p.quantity === 0).length;


    return (
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Inventory Management</h1>
                    <p className="text-gray-600">Manage your product inventory and stock levels</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center px-3 lg:px-4 py-2 bg-blue-600 text-white text-sm lg:text-base rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <BiPlus className="h-4 w-4 mr-2" />
                    Add Product
                </button>
            </div>

            {/* Stock Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <BiCheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xl lg:text-2xl font-bold text-gray-900">{inStockCount}</p>
                            <p className="text-sm text-gray-600">In Stock</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <BiPackage className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-xl lg:text-2xl font-bold text-gray-900">{lowStockCount}</p>
                            <p className="text-sm text-gray-600">Low Stock</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <FiAlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xl lg:text-2xl font-bold text-gray-900">{outOfStockCount}</p>
                            <p className="text-sm text-gray-600">Out of Stock</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                            <BiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Items</option>
                            <option value="in-stock">In Stock</option>
                            <option value="low-stock">Low Stock</option>
                            <option value="out-of-stock">Out of Stock</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto -mx-4 lg:mx-0">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                    SKU
                                </th>
                                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                    Category
                                </th>
                                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock
                                </th>
                                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                                    Status
                                </th>
                                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProducts.map((product) => {
                                const stockStatus = getStockStatus(product.quantity);
                                return (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-3 lg:px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 truncate max-w-32 lg:max-w-none">{product.name}</div>
                                                <div className="text-xs lg:text-sm text-gray-500 truncate max-w-32 lg:max-w-none">{product.description}</div>
                                                <div className="text-xs text-gray-500 sm:hidden">SKU: {product.sku}</div>
                                                <div className="text-xs text-gray-500 md:hidden">{product.category?.name || 'No Category'}</div>
                                            </div>
                                        </td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                                            {product.sku}
                                        </td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                                            {product.category?.name || 'No Category'}
                                        </td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatCurrency(product.price)}
                                        </td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{product.quantity}</div>
                                            <div className="lg:hidden">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                                                    {stockStatus.label}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                                                {stockStatus.label}
                                            </span>
                                        </td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => startEdit(product)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <FiEdit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <BsTrash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No products found</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 lg:p-6 rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-base lg:text-lg font-bold text-gray-900 mb-4">
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={productForm.name}
                                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={productForm.description}
                                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cost (Rs) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={productForm.cost}
                                        onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Price (Rs) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={productForm.price}
                                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SKU *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={productForm.sku}
                                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Stock Quantity *
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={productForm.quantity}
                                    onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={productForm.category_id}
                                        onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCategoryModal(true)}
                                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                    >
                                        <BiPlus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Saving...' : (editingProduct ? 'Update' : 'Add')} Product
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Category Modal */}
            {showAddCategoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 lg:p-6 rounded-xl max-w-sm w-full mx-4">
                        <h2 className="text-base lg:text-lg font-bold text-gray-900 mb-4">Add New Category</h2>
                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter category name"
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={categoryLoading}
                                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {categoryLoading ? 'Adding...' : 'Add Category'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddCategoryModal(false);
                                        setNewCategoryName('');
                                    }}
                                    className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};