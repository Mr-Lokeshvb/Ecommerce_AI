import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get IP address (in production, get from backend)
      const ipAddress = '127.0.0.1'; // Placeholder

      const response = await api.post('/api/admin/login', {
        email,
        password,
        ipAddress
      });

      if (response?.success) {
        // Store admin token and data
        localStorage.setItem('adminToken', response.token);
        localStorage.setItem('adminData', JSON.stringify(response.admin));
        
        toast.success(`Welcome back, ${response.admin.name}!`);
        navigate('/admin-dashboard');
      } else {
        toast.error(response?.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      
      if (error.response?.status === 423) {
        toast.error('Account locked due to too many failed attempts. Please try again later.');
      } else if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'Access denied');
      } else if (error.response?.status === 401) {
        toast.error(error.response?.data?.message || 'Invalid credentials. Make sure you created the super admin account.');
      } else {
        toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          {/* Admin Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">Admin Control Panel</h2>
          <p className="mt-2 text-blue-200">Secure access to system management</p>
        </div>

        {/* Security Warning */}
        <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-300">Security Notice</h3>
              <p className="text-xs text-yellow-200 mt-1">
                This is a restricted area. All access attempts are logged and monitored.
                Unauthorized access is prohibited.
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-slate-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@fashionvr.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
              </span>
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex items-center justify-center text-xs text-slate-400">
              <Activity className="h-4 w-4 mr-2" />
              <span>Session timeout: 8 hours</span>
            </div>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700">
          <h3 className="text-center font-semibold text-blue-300 mb-4">🔐 Demo Admin Access</h3>
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-600">
            <div className="text-sm text-slate-300 space-y-1">
              <p><strong className="text-blue-400">Email:</strong> admin@fashionvr.com</p>
              <p><strong className="text-blue-400">Password:</strong> admin123</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">
            For testing purposes only
          </p>
        </div>

        {/* Back to Site */}
        <div className="text-center">
          <Link
            to="/"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Main Site
          </Link>
        </div>

        {/* Security Features */}
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
          <h4 className="text-xs font-semibold text-slate-300 mb-3 text-center">Security Features</h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-blue-400">🔒</div>
              <div className="text-xs text-slate-400 mt-1">Encrypted</div>
            </div>
            <div>
              <div className="text-lg font-bold text-cyan-400">📊</div>
              <div className="text-xs text-slate-400 mt-1">Activity Logs</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">✓</div>
              <div className="text-xs text-slate-400 mt-1">Verified</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
