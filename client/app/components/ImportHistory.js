'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
//......
export default function ImportHistory() {
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [historyData, statsData] = await Promise.all([
        api.getHistory(),
        api.getQueueStats(),
      ]);
      // `api.getHistory()` returns an array of import logs on the server.
      setHistory(historyData || []);
      // Adjust current page if necessary after new data arrives
      const totalPages = Math.max(1, Math.ceil((historyData?.length || 0) / pageSize));
      setCurrentPage((p) => (p > totalPages ? totalPages : p));
      setStats(statsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (!loading) {
        toast.error('Failed to fetch data');
      }
    }
  };

  const handleTriggerImport = async () => {
    setTriggering(true);
    const loadingToast = toast.loading('Triggering import from all sources...');

    try {
      const response = await api.triggerImport();
      toast.dismiss(loadingToast);

      const sourceCount = response.importIds?.length || 0;
      toast.success(
        `Import triggered successfully! ${sourceCount} source${sourceCount !== 1 ? 's' : ''} queued for processing.`,
        { duration: 5000 }
      );

      // Refresh data after a short delay
      setTimeout(fetchData, 1000);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(`Failed to trigger import: ${error.message}`, { duration: 5000 });
    } finally {
      setTriggering(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Import History</h1>
        <button
          onClick={handleTriggerImport}
          disabled={triggering}
          className={`px-6 py-2 rounded font-medium transition-colors ${
            triggering
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {triggering ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Trigger Import'
          )}
        </button>
      </div>

      {/* Queue Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-100 p-4 rounded">
            <p className="text-sm text-gray-600">Waiting</p>
            <p className="text-2xl font-bold">{stats.waiting}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold">{stats.active}</p>
          </div>
          <div className="bg-green-100 p-4 rounded">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>
          <div className="bg-red-100 p-4 rounded">
            <p className="text-sm text-gray-600">Failed</p>
            <p className="text-2xl font-bold">{stats.failed}</p>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                File Name (URL)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                New
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Failed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(() => {
              const total = history.length;
              const totalPages = Math.max(1, Math.ceil(total / pageSize));
              const startIndex = (currentPage - 1) * pageSize;
              const endIndex = Math.min(startIndex + pageSize, total);
              const pageItems = history.slice(startIndex, endIndex);

              return pageItems.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-blue-600 truncate max-w-xs">
                  {log.fileName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {log.totalFetched}
                </td>
                <td className="px-6 py-4 text-sm text-green-600 font-semibold">
                  {log.newJobs}
                </td>
                <td className="px-6 py-4 text-sm text-blue-600 font-semibold">
                  {log.updatedJobs}
                </td>
                <td className="px-6 py-4 text-sm text-red-600 font-semibold">
                  {log.failedJobs}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      log.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : log.status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : log.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>

        {/* Pagination controls - frontend-only */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {history.length === 0 ? (
              'No import history'
            ) : (
              <>
                Showing <span className="font-medium">{Math.min((currentPage - 1) * pageSize + 1, history.length)}</span>
                {' - '}
                <span className="font-medium">{Math.min(currentPage * pageSize, history.length)}</span>
                {' of '}
                <span className="font-medium">{history.length}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = parseInt(e.target.value, 10) || 10;
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              className="border rounded p-1 text-sm"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>

            <Pagination
              total={history.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


function Pagination({ total, pageSize, currentPage, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const makePages = () => {
    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  if (totalPages === 1) return null;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded border text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
      >
        Prev
      </button>

      {makePages().map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1 rounded border text-sm ${p === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded border text-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
      >
        Next
      </button>
    </div>
  );
}