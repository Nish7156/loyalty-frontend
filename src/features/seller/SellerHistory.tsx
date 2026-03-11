import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { activityApi } from '../../lib/api';
import type { Activity } from '../../lib/api';

export function SellerHistory() {
  const { auth } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'REJECTED'>('ALL');

  const branchId = auth.type === 'staff' ? auth.staff.branchId : '';

  useEffect(() => {
    if (!branchId) return;
    activityApi
      .list()
      .then((list) => {
        const forBranch = list
          .filter((a) => a.branchId === branchId && a.status !== 'PENDING')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActivities(forBranch);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [branchId]);

  if (loading) return <p className="text-gray-600">Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  const filteredActivities = filter === 'ALL'
    ? activities
    : activities.filter((a) => a.status === filter);

  const approvedCount = activities.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = activities.filter((a) => a.status === 'REJECTED').length;
  const totalAmount = activities
    .filter((a) => a.status === 'APPROVED' && a.value != null)
    .reduce((sum, a) => sum + Number(a.value), 0);

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Check-in History</h1>
        <p className="text-gray-600">View all processed customer check-ins</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-emerald-700 text-sm font-medium">Approved</p>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{approvedCount}</p>
          <p className="text-emerald-600 text-sm">Check-ins approved</p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200/50 rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-rose-700 text-sm font-medium">Rejected</p>
            <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✕</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{rejectedCount}</p>
          <p className="text-rose-600 text-sm">Check-ins rejected</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/50 rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-indigo-700 text-sm font-medium">Total Revenue</p>
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">₹{totalAmount}</p>
          <p className="text-indigo-600 text-sm">From approved check-ins</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2 mb-6 inline-flex gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'ALL'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All ({activities.length})
        </button>
        <button
          onClick={() => setFilter('APPROVED')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'APPROVED'
              ? 'bg-emerald-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setFilter('REJECTED')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'REJECTED'
              ? 'bg-red-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Rejected ({rejectedCount})
        </button>
      </div>

      {/* History List */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-500 text-lg font-medium mb-2">No history found</p>
          <p className="text-gray-400 text-sm">
            {filter === 'ALL'
              ? 'Processed check-ins will appear here'
              : `No ${filter.toLowerCase()} check-ins yet`
            }
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredActivities.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {a.customerName ? a.customerName.charAt(0).toUpperCase() : a.customerId.slice(-2)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{a.customerName || a.customerId}</p>
                          {a.customerName && (
                            <p className="text-xs text-gray-500 font-mono">{a.customerId}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {a.value != null ? (
                        <span className="text-base font-semibold text-gray-900">₹{Number(a.value).toFixed(2)}</span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          a.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {a.status === 'APPROVED' ? '✓ Approved' : '✕ Rejected'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredActivities.map((a) => (
              <div key={a.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {a.customerName ? a.customerName.charAt(0).toUpperCase() : a.customerId.slice(-2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{a.customerName || a.customerId}</p>
                    {a.customerName && (
                      <p className="text-xs text-gray-500 font-mono">{a.customerId}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                      a.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {a.status === 'APPROVED' ? '✓' : '✕'}
                  </span>
                </div>
                {a.value != null && (
                  <div className="mt-2 p-2.5 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">Amount:</span>{' '}
                      <span className="font-bold">₹{Number(a.value).toFixed(2)}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
