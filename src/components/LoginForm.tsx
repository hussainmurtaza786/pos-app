import React, { useState } from 'react';
import { FiEyeOff } from 'react-icons/fi';
import { FaEye } from 'react-icons/fa6';
import { IoIosTrendingUp } from 'react-icons/io';
import { useDispatch } from 'react-redux';
import { updateAuthData } from '@/redux/slices/auth';

interface LoginFormProps {
  onLogin: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        setError('Server did not return JSON.');
        return;
      }


      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Destructure token and userDetails from response
      const { token, userDetails } = data.data;

      // Save to Redux
      dispatch(updateAuthData({ authToken: token, userDetails }));

      // Optional: Save token in localStorage or cookies
      localStorage.setItem('token', token);


      // Call onLogin callback
      onLogin();
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-2 lg:p-3 bg-blue-600 rounded-xl shadow-lg">
              <IoIosTrendingUp className="h-8 lg:h-10 w-8 lg:w-10 text-white" />
            </div>
          </div>
          <h2 className="mt-4 lg:mt-6 text-2xl lg:text-3xl font-bold text-gray-900">
            Sign in to POS System
          </h2>
          <p className="mt-2 text-sm lg:text-base text-gray-600">
            Access your sales and inventory management
          </p>
        </div>

        <div className="bg-white p-6 lg:p-8 rounded-xl shadow-lg border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 lg:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm lg:text-base"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 lg:py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm lg:text-base"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 lg:py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm lg:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};