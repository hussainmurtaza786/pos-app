import React, { useState } from 'react';
import { BiMinus, BiPlus, BiX } from 'react-icons/bi';
import { CgShoppingCart } from 'react-icons/cg';

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock_quantity: number;
  category_id: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const Sales: React.FC = () => {
  const [products] = useState<Product[]>([
    { id: '1', name: 'Sample Product 1', price: 100, cost: 60, stock_quantity: 10, category_id: 'a' },
    { id: '2', name: 'Sample Product 2', price: 150, cost: 80, stock_quantity: 5, category_id: 'b' }
  ]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cashReceived, setCashReceived] = useState<number | ''>('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return;
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        setCart(cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (productId: string, change: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) return null;
        if (newQuantity > item.product.stock_quantity) return item;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getCartProfit = () => {
    return cart.reduce((total, item) =>
      total + ((item.product.price - item.product.cost) * item.quantity), 0);
  };

  const changeToReturn = cashReceived !== '' ? cashReceived - getCartTotal() : 0;

  return (
    <div className="p-4 lg:p-6 h-full flex flex-col lg:flex-row gap-4 lg:gap-6">
      <div className="flex-1">
        <h2 className="text-2xl font-semibold mb-2">Sales</h2>
        <p className="text-gray-500 mb-4">Browse and add products to the sales cart</p>

        <div className="mb-4">
          <label htmlFor="product-search" className="block mb-1 text-sm font-medium">Product Search</label>
          <div className="relative">
            <input
              id="product-search"
              type="text"
              placeholder="Search products..."
              className="pl-4 pr-4 py-2 border border-gray-300 rounded w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          {filteredProducts.map(product => (
            <div key={product.id} className="border p-4 rounded flex items-center justify-between">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-500">Stock: {product.stock_quantity}</p>
                <p className="text-green-600 font-semibold">${product.price.toFixed(2)}</p>
              </div>
              <button
                onClick={() => addToCart(product)}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
              >
                <BiPlus size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
        <div className="flex items-center space-x-3 mb-6">
          <CgShoppingCart className="h-5 w-5 text-blue-600" />
          <h3 className="text-base lg:text-lg font-semibold text-gray-900">Sales Cart</h3>
          <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">{cart.length} items</span>
        </div>

        {cart.map(item => (
          <div key={item.product.id} className="border p-3 rounded flex items-center justify-between mb-2">
            <div>
              <p className="font-medium text-gray-900">{item.product.name}</p>
              <p className="text-sm text-gray-500">${item.product.price.toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateCartQuantity(item.product.id, -1)} className="text-gray-600 hover:text-black"><BiMinus size={18} /></button>
              <span className="font-semibold text-lg">{item.quantity}</span>
              <button onClick={() => updateCartQuantity(item.product.id, 1)} className="text-gray-600 hover:text-black"><BiPlus size={18} /></button>
              <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 hover:text-red-700"><BiX size={18} /></button>
            </div>
          </div>
        ))}

        {cart.length > 0 && (
          <>
            <div className="border-t border-gray-200 pt-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Profit:</span>
                <span className="text-green-600">${getCartProfit().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Amount Received:</span>
                <input
                  type="number"
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>Change to Return:</span>
                <span className="text-gray-800 font-medium">
                  {cashReceived !== '' && cashReceived >= getCartTotal()
                    ? `$${changeToReturn.toFixed(2)}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                className="w-full py-2.5 px-4 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                onClick={() => alert('Cash payment selected')}
              >
                Cash Payment
              </button>
              <button
                className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                onClick={() => alert('Card payment selected')}
              >
                Card Payment
              </button>
              <button
                className="w-full py-2.5 px-4 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                onClick={() => alert('Digital payment selected')}
              >
                Digital Payment
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sales;
