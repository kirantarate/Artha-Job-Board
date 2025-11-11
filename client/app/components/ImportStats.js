'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const ImportStats = () => {
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchImportHistory();
  }, []);

  const fetchImportHistory = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/import/history`);
      if (!response.ok) throw new Error('Failed to fetch import history');
      const data = await response.json();
      setImports(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleRetry = async (importId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/import/retry/${importId}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to retry import');
      await fetchImportHistory(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center p-4">Loading import history...</div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {imports.map((importLog) => (
            <tr key={importLog._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new URL(importLog.fileName).hostname}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(importLog.timestamp), 'MMM d, yyyy HH:mm')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(importLog.status)}`}>
                  {importLog.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {importLog.totalFetched}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                {importLog.newJobs}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                {importLog.updatedJobs}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                {importLog.failedJobs}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {importLog.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(importLog._id)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Retry
                  </button>
                )}
                {importLog.failedJobs > 0 && (
                  <div className="mt-1 text-xs text-red-500">
                    {importLog.failures?.map((failure, index) => (
                      <div key={index}>{failure.reason} ({failure.count})</div>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ImportStats;
