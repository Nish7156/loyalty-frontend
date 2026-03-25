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

  if (loading) return <p style={{ color: 'var(--t2)' }}>Loading…</p>;
  if (error) return <p style={{ color: 'var(--re)' }}>{error}</p>;

  const filteredActivities = filter === 'ALL'
    ? activities
    : activities.filter((a) => a.status === filter);

  const approvedCount = activities.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = activities.filter((a) => a.status === 'REJECTED').length;
  const totalAmount = activities
    .filter((a) => a.status === 'APPROVED' && a.value != null)
    .reduce((sum, a) => sum + Number(a.value), 0);

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24" style={{ background: 'var(--bg)' }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--t)' }}>Check-in History</h1>
        <p style={{ color: 'var(--t2)' }}>View all processed customer check-ins</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <div className="rounded-2xl p-4 sm:p-6" style={{ background: 'var(--grbg)', border: '1px solid rgba(42,96,64,0.15)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: 'var(--gr)' }}>Approved</p>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(42,96,64,0.1)' }}>
              <span className="material-symbols-rounded" style={{ color: 'var(--gr)', fontSize: '24px' }}>check_circle</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: 'var(--t)' }}>{approvedCount}</p>
          <p className="text-sm" style={{ color: 'var(--gr)' }}>Check-ins approved</p>
        </div>

        <div className="rounded-2xl p-4 sm:p-6" style={{ background: 'var(--rebg)', border: '1px solid rgba(176,58,42,0.15)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: 'var(--re)' }}>Rejected</p>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(176,58,42,0.1)' }}>
              <span className="material-symbols-rounded" style={{ color: 'var(--re)', fontSize: '24px' }}>cancel</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: 'var(--t)' }}>{rejectedCount}</p>
          <p className="text-sm" style={{ color: 'var(--re)' }}>Check-ins rejected</p>
        </div>

        <div className="rounded-2xl p-4 sm:p-6" style={{ background: 'var(--bdl)', border: '1px solid var(--bd)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: 'var(--a)' }}>Total Revenue</p>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(216,90,48,0.1)' }}>
              <span className="material-symbols-rounded" style={{ color: 'var(--a)', fontSize: '24px' }}>payments</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: 'var(--t)' }}>₹{totalAmount}</p>
          <p className="text-sm" style={{ color: 'var(--a)' }}>From approved check-ins</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="rounded-xl p-2 mb-6 inline-flex gap-2" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
        <button
          onClick={() => setFilter('ALL')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={filter === 'ALL' ? { background: 'var(--a)', color: 'var(--s)' } : { color: 'var(--t2)' }}
        >
          All ({activities.length})
        </button>
        <button
          onClick={() => setFilter('APPROVED')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={filter === 'APPROVED' ? { background: 'var(--gr)', color: 'var(--s)' } : { color: 'var(--t2)' }}
        >
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setFilter('REJECTED')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={filter === 'REJECTED' ? { background: 'var(--re)', color: 'var(--s)' } : { color: 'var(--t2)' }}
        >
          Rejected ({rejectedCount})
        </button>
      </div>

      {/* History List */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={{ background: 'var(--s)', border: '1px solid var(--bdl)' }}>
          <span className="material-symbols-rounded" style={{ fontSize: '64px', color: 'var(--t3)' }}>assignment</span>
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--t2)' }}>No history found</p>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>
            {filter === 'ALL'
              ? 'Processed check-ins will appear here'
              : `No ${filter.toLowerCase()} check-ins yet`
            }
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: 'var(--bdl)' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t)', borderBottom: '1px solid var(--bd)' }}>Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t)', borderBottom: '1px solid var(--bd)' }}>Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t)', borderBottom: '1px solid var(--bd)' }}>Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t)', borderBottom: '1px solid var(--bd)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((a, idx) => (
                  <tr key={a.id} className="transition-colors" style={{ borderBottom: idx < filteredActivities.length - 1 ? '1px solid var(--bdl)' : 'none' }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ background: 'linear-gradient(135deg, var(--a), #E8784E)' }}>
                          {a.customerName ? a.customerName.charAt(0).toUpperCase() : a.customerId.slice(-2)}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--t)' }}>{a.customerName || a.customerId}</p>
                          {a.customerName && (
                            <p className="text-xs font-mono" style={{ color: 'var(--t3)' }}>{a.customerId}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {a.value != null ? (
                        <span className="text-base font-semibold" style={{ color: 'var(--t)' }}>₹{Number(a.value).toFixed(2)}</span>
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--t3)' }}>—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--t2)' }}>
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                        style={a.status === 'APPROVED'
                          ? { background: 'var(--grbg)', color: 'var(--gr)', border: '1px solid rgba(42,96,64,0.2)' }
                          : { background: 'var(--rebg)', color: 'var(--re)', border: '1px solid rgba(176,58,42,0.2)' }
                        }
                      >
                        {a.status === 'APPROVED' ? (
                          <><span className="material-symbols-rounded mr-1" style={{ fontSize: '14px' }}>check</span> Approved</>
                        ) : (
                          <><span className="material-symbols-rounded mr-1" style={{ fontSize: '14px' }}>close</span> Rejected</>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {filteredActivities.map((a, idx) => (
              <div key={a.id} className="p-4 transition-colors" style={{ borderBottom: idx < filteredActivities.length - 1 ? '1px solid var(--bdl)' : 'none' }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--a), #E8784E)' }}>
                    {a.customerName ? a.customerName.charAt(0).toUpperCase() : a.customerId.slice(-2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold" style={{ color: 'var(--t)' }}>{a.customerName || a.customerId}</p>
                    {a.customerName && (
                      <p className="text-xs font-mono" style={{ color: 'var(--t3)' }}>{a.customerId}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                    style={a.status === 'APPROVED'
                      ? { background: 'var(--grbg)', color: 'var(--gr)' }
                      : { background: 'var(--rebg)', color: 'var(--re)' }
                    }
                  >
                    {a.status === 'APPROVED' ? (
                      <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>check</span>
                    ) : (
                      <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>close</span>
                    )}
                  </span>
                </div>
                {a.value != null && (
                  <div className="mt-2 p-2.5 rounded-lg" style={{ background: 'var(--bdl)' }}>
                    <p className="text-sm" style={{ color: 'var(--t)' }}>
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
