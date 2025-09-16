// src/components/admin/cache-manager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Trash2, 
  Database, 
  Activity, 
  Settings,
  AlertCircle,
  CheckCircle,
  Zap
} from 'lucide-react';

interface CacheStats {
  totalKeys: number;
  productKeys: number;
  categoryKeys: number;
  orderKeys: number;
}

export default function CacheManager() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCacheStats();
  }, []);

  const fetchCacheStats = async () => {
    try {
      const response = await fetch('/api/admin/cache?action=stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch cache stats');
    }
  };

  const clearAllCache = async () => {
    if (!confirm('Are you sure you want to clear all cache? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_all' })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(data.message);
        await fetchCacheStats();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const clearPattern = async (pattern: string) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_pattern', data: { pattern } })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(data.message);
        await fetchCacheStats();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to clear cache pattern');
    } finally {
      setLoading(false);
    }
  };

  const warmUpCache = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'warm_up' })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(data.message);
        await fetchCacheStats();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to warm up cache');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" />
          Redis Cache Manager
        </h2>
        <button
          onClick={fetchCacheStats}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-800 text-sm">{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      )}

      {/* Cache Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <Activity className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalKeys}</div>
            <div className="text-sm text-gray-600">Total Keys</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <Database className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.productKeys}</div>
            <div className="text-sm text-gray-600">Product Keys</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <Settings className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.categoryKeys}</div>
            <div className="text-sm text-gray-600">Category Keys</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <RefreshCw className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.orderKeys}</div>
            <div className="text-sm text-gray-600">Order Keys</div>
          </div>
        </div>
      )}

      {/* Cache Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Cache Operations</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Warm Up Cache */}
          <button
            onClick={warmUpCache}
            disabled={loading}
            className="flex items-center justify-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <Zap className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">Warm Up Cache</span>
          </button>

          {/* Clear Product Cache */}
          <button
            onClick={() => clearPattern('product*')}
            disabled={loading}
            className="flex items-center justify-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">Clear Products</span>
          </button>

          {/* Clear Category Cache */}
          <button
            onClick={() => clearPattern('categor*')}
            disabled={loading}
            className="flex items-center justify-center gap-2 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-purple-800">Clear Categories</span>
          </button>

          {/* Clear Search Cache */}
          <button
            onClick={() => clearPattern('search:*')}
            disabled={loading}
            className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Clear Search</span>
          </button>

          {/* Clear Order Cache */}
          <button
            onClick={() => clearPattern('order*')}
            disabled={loading}
            className="flex items-center justify-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-orange-800">Clear Orders</span>
          </button>

          {/* Clear All Cache */}
          <button
            onClick={clearAllCache}
            disabled={loading}
            className="flex items-center justify-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Clear All Cache</span>
          </button>
        </div>
      </div>

      {/* Cache Configuration Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Cache Configuration</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>• Products: 30 minutes TTL</div>
          <div>• Categories: 1 hour TTL</div>
          <div>• Orders: 15 minutes TTL</div>
          <div>• Search Results: 30 minutes TTL</div>
          <div>• Customer Pricing: 30 minutes TTL</div>
        </div>
      </div>
    </div>
  );
}
