import { useState } from 'react';

export default function CacheTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState('0np8KgXvTIysNnwzSOaX');

  const testCacheFlow = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test-redis?test=cache-flow&productId=${productId}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Request failed', details: error });
    }
    setLoading(false);
  };

  const clearCache = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test-redis?productId=${productId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Cache clear failed', details: error });
    }
    setLoading(false);
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-redis');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Connection test failed', details: error });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Redis Cache Testing Dashboard</h1>
      
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Product ID:
          </label>
          <input
            type="text"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Enter product ID"
          />
        </div>
        
        <div className="space-x-4">
          <button
            onClick={testCacheFlow}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Cache Flow'}
          </button>
          
          <button
            onClick={clearCache}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Clearing...' : 'Clear Cache'}
          </button>
          
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-gray-50 shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          <div className="mb-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result.success ? '✅ Success' : '❌ Error'}
            </div>
            <span className="ml-2 font-medium">{result.status}</span>
          </div>
          
          <p className="text-gray-700 mb-4">{result.message}</p>
          
          {result.steps && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Execution Steps:</h3>
              <div className="space-y-2">
                {result.steps.map((step: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Step {step.step}: {step.action}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        step.found ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {step.found ? 'Found' : 'Not Found'} - {step.timeTaken}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{step.source}</p>
                    {step.ttl && <p className="text-xs text-blue-600">TTL: {step.ttl}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {result.totalTime && (
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <h3 className="font-semibold">Performance</h3>
              <p><strong>Total Time:</strong> {result.totalTime}</p>
              <p><strong>Data Source:</strong> {result.dataSource}</p>
              {result.breakdown && (
                <div className="mt-2 text-sm">
                  <p>Cache Check: {result.breakdown.cacheCheck}</p>
                  <p>Database Fetch: {result.breakdown.databaseFetch}</p>
                  <p>Cache Store: {result.breakdown.cacheStore}</p>
                </div>
              )}
            </div>
          )}
          
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">Raw JSON Response</summary>
            <pre className="mt-2 bg-gray-800 text-green-400 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">How to Test:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li><strong>First Request:</strong> Click "Test Cache Flow" - should fetch from database (~250ms)</li>
          <li><strong>Second Request:</strong> Click again - should fetch from Redis cache (~3ms)</li>
          <li><strong>Clear Cache:</strong> Click "Clear Cache" to remove cached data</li>
          <li><strong>Third Request:</strong> Click "Test Cache Flow" again - back to database</li>
        </ol>
        <p className="mt-2 text-xs text-gray-600">
          Watch the performance difference! Database: ~250ms vs Redis: ~3ms
        </p>
      </div>
    </div>
  );
}
