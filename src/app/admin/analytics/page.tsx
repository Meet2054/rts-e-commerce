'use client';
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter, 
  Download, 
  Trash2,
  RefreshCw,
  Search,
  Users,
  Database,
  Globe,
  ShoppingCart,
  Settings,
  Info,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { clientLogger } from '@/lib/client-logger';

// Types for log data
interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
  category: string;
  message: string;
  details?: any;
  userId?: string;
  userEmail?: string;
  duration?: number;
}

interface LogStats {
  totalLogs: number;
  logsByLevel: Record<string, number>;
  logsByCategory: Record<string, number>;
  recentErrors: LogEntry[];
  topUsers: Array<{ email: string; count: number }>;
}

interface LogsResponse {
  logs: LogEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
  stats: LogStats;
  filters: {
    levels: string[];
    categories: string[];
  };
}

const LogLevelIcons = {
  info: <Info className="h-4 w-4" />,
  warn: <AlertTriangle className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
  success: <CheckCircle className="h-4 w-4" />,
  debug: <Settings className="h-4 w-4" />
};

const LogLevelColors = {
  info: 'text-blue-600 bg-blue-100',
  warn: 'text-yellow-600 bg-yellow-100',
  error: 'text-red-600 bg-red-100',
  success: 'text-green-600 bg-green-100',
  debug: 'text-gray-600 bg-gray-100'
};

const CategoryIcons: Record<string, React.ReactNode> = {
  auth: <Users className="h-4 w-4" />,
  user_management: <Users className="h-4 w-4" />,
  orders: <ShoppingCart className="h-4 w-4" />,
  products: <Database className="h-4 w-4" />,
  cart: <ShoppingCart className="h-4 w-4" />,
  cache: <Database className="h-4 w-4" />,
  api: <Globe className="h-4 w-4" />,
  pricing: <Database className="h-4 w-4" />,
  system: <Settings className="h-4 w-4" />,
  firebase: <Database className="h-4 w-4" />,
  redis: <Database className="h-4 w-4" />
};

export default function AdminAnalytics() {
  const { token } = useAuth();
  const [logsData, setLogsData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [limit, setLimit] = useState(50);
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Fetch logs from API
  const fetchLogs = async (page: number = currentPage) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(selectedLevel && { level: selectedLevel }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(searchTerm && { search: searchTerm }),
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      });

      const response = await fetch(`/api/admin/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: LogsResponse = await response.json();
      setLogsData(data);
      setCurrentPage(page);
    } catch (err) {
      clientLogger.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  // Clear old logs
  const clearOldLogs = async (olderThanDays: number = 30) => {
    if (!token || !confirm(`Are you sure you want to delete logs older than ${olderThanDays} days?`)) return;
    
    try {
      const response = await fetch(`/api/admin/logs?olderThanDays=${olderThanDays}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete logs');
      }

      const result = await response.json();
      alert(`Successfully deleted ${result.deletedCount} log entries`);
      fetchLogs(1); // Refresh logs
    } catch (err) {
      console.error('Error deleting logs:', err);
      alert('Failed to delete logs');
    }
  };

  // Export logs to CSV
  const exportLogs = () => {
    if (!logsData?.logs.length) return;
    
    const headers = ['Timestamp', 'Level', 'Category', 'Message', 'User Email', 'Duration (ms)', 'Details'];
    const csvContent = [
      headers.join(','),
      ...logsData.logs.map(log => [
        log.timestamp.toISOString(),
        log.level,
        log.category,
        `"${log.message.replace(/"/g, '""')}"`,
        log.userEmail || '',
        log.duration || '',
        `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLogs(currentPage);
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, currentPage]);

  // Initial fetch
  useEffect(() => {
    fetchLogs(1);
  }, [token, selectedLevel, selectedCategory, searchTerm, dateRange, limit]);

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format duration
  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    return duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`;
  };

  if (loading && !logsData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Activity className="mr-2 h-6 w-6" />
              Admin Analytics & Logs
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor system activity, errors, and performance metrics
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 text-sm font-medium rounded-md border ${
                autoRefresh
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </button>
            
            <button
              onClick={() => fetchLogs(currentPage)}
              disabled={loading}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={exportLogs}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
            
            <button
              onClick={() => clearOldLogs(30)}
              className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear Old
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {logsData?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Logs</p>
                <p className="text-lg font-semibold text-gray-900">{logsData.stats.totalLogs.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-lg font-semibold text-gray-900">{logsData.stats.logsByLevel.error || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Warnings</p>
                <p className="text-lg font-semibold text-gray-900">{logsData.stats.logsByLevel.warn || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Success</p>
                <p className="text-lg font-semibold text-gray-900">{logsData.stats.logsByLevel.success || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-4 py-3 border-b border-gray-200">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {(selectedLevel || selectedCategory || searchTerm || dateRange.startDate) && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Active
              </span>
            )}
          </button>
        </div>
        
        {showFilters && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                {logsData?.filters.levels.map(level => (
                  <option key={level} value={level}>{level.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {logsData?.filters.categories.map(category => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Logs</h3>
          {logsData?.pagination && (
            <p className="text-sm text-gray-600 mt-1">
              Showing {((logsData.pagination.currentPage - 1) * logsData.pagination.limit) + 1} to{' '}
              {Math.min(logsData.pagination.currentPage * logsData.pagination.limit, logsData.pagination.totalCount)} of{' '}
              {logsData.pagination.totalCount} entries
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logsData?.logs.map((log) => (
                <tr 
                  key={log.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${LogLevelColors[log.level]}`}>
                      {LogLevelIcons[log.level]}
                      <span className="ml-1">{log.level.toUpperCase()}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center text-sm text-gray-900">
                      {CategoryIcons[log.category] || <Database className="h-4 w-4" />}
                      <span className="ml-1">{log.category.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                    {log.message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.userEmail || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(log.duration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logsData?.pagination && logsData.pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchLogs(logsData.pagination.currentPage - 1)}
                disabled={logsData.pagination.currentPage === 1 || loading}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {logsData.pagination.currentPage} of {logsData.pagination.totalPages}
              </span>
              <button
                onClick={() => fetchLogs(logsData.pagination.currentPage + 1)}
                disabled={logsData.pagination.currentPage === logsData.pagination.totalPages || loading}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                    <p className="text-sm text-gray-900">{formatTimestamp(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Level</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${LogLevelColors[selectedLog.level]}`}>
                      {LogLevelIcons[selectedLog.level]}
                      <span className="ml-1">{selectedLog.level.toUpperCase()}</span>
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="text-sm text-gray-900">{selectedLog.category.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User</label>
                    <p className="text-sm text-gray-900">{selectedLog.userEmail || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedLog.message}</p>
                </div>
                {selectedLog.details && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Details</label>
                    <pre className="mt-1 p-3 bg-gray-50 rounded-md text-xs text-gray-900 overflow-x-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}