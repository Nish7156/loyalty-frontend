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

  if (loading) return <p style={{ color: '#7B5E54' }}>Loading…</p>;
  if (error) return <p style={{ color: '#B03A2A' }}>{error}</p>;

  const filteredActivities = filter === 'ALL'
    ? activities
    : activities.filter((a) => a.status === filter);

  const approvedCount = activities.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = activities.filter((a) => a.status === 'REJECTED').length;
  const totalAmount = activities
    .filter((a) => a.status === 'APPROVED' && a.value != null)
    .reduce((sum, a) => sum + Number(a.value), 0);

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24" style={{ background: '#FAF9F6' }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#5D4037' }}>Check-in History</h1>
        <p style={{ color: '#7B5E54' }}>View all processed customer check-ins</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <div className="rounded-2xl p-4 sm:p-6" style={{ background: '#E4F2EB', border: '1px solid rgba(42,96,64,0.15)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: '#2A6040' }}>Approved</p>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(42,96,64,0.1)' }}>
              <span className="material-symbols-rounded" style={{ color: '#2A6040', fontSize: '24px' }}>check_circle</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: '#5D4037' }}>{approvedCount}</p>
          <p className="text-sm" style={{ color: '#2A6040' }}>Check-ins approved</p>
        </div>

        <div className="rounded-2xl p-4 sm:p-6" style={{ background: '#FDEEE9', border: '1px solid rgba(176,58,42,0.15)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: '#B03A2A' }}>Rejected</p>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(176,58,42,0.1)' }}>
              <span className="material-symbols-rounded" style={{ color: '#B03A2A', fontSize: '24px' }}>cancel</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: '#5D4037' }}>{rejectedCount}</p>
          <p className="text-sm" style={{ color: '#B03A2A' }}>Check-ins rejected</p>
        </div>

        <div className="rounded-2xl p-4 sm:p-6" style={{ background: '#FAECE7', border: '1px solid #F5C4B3', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: '#D85A30' }}>Total Revenue</p>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(216,90,48,0.1)' }}>
              <span className="material-symbols-rounded" style={{ color: '#D85A30', fontSize: '24px' }}>payments</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: '#5D4037' }}>₹{totalAmount}</p>
          <p className="text-sm" style={{ color: '#D85A30' }}>From approved check-ins</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="rounded-xl p-2 mb-6 inline-flex gap-2" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
        <button
          onClick={() => setFilter('ALL')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={filter === 'ALL' ? { background: '#D85A30', color: '#FFF' } : { color: '#7B5E54' }}
        >
          All ({activities.length})
        </button>
        <button
          onClick={() => setFilter('APPROVED')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={filter === 'APPROVED' ? { background: '#2A6040', color: '#FFF' } : { color: '#7B5E54' }}
        >
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setFilter('REJECTED')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={filter === 'REJECTED' ? { background: '#B03A2A', color: '#FFF' } : { color: '#7B5E54' }}
        >
          Rejected ({rejectedCount})
        </button>
      </div>

      {/* History List */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={{ background: '#FFF', border: '1px solid #FAECE7' }}>
          <span className="material-symbols-rounded" style={{ fontSize: '64px', color: '#A08880' }}>assignment</span>
          <p className="text-lg font-medium mb-2" style={{ color: '#7B5E54' }}>No history found</p>
          <p className="text-sm" style={{ color: '#A08880' }}>
            {filter === 'ALL'
              ? 'Processed check-ins will appear here'
              : `No ${filter.toLowerCase()} check-ins yet`
            }
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: '#FAECE7' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037', borderBottom: '1px solid #F5C4B3' }}>Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037', borderBottom: '1px solid #F5C4B3' }}>Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037', borderBottom: '1px solid #F5C4B3' }}>Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037', borderBottom: '1px solid #F5C4B3' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((a, idx) => (
                  <tr key={a.id} className="transition-colors" style={{ borderBottom: idx < filteredActivities.length - 1 ? '1px solid #FAECE7' : 'none' }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ background: 'linear-gradient(135deg, #D85A30, #E8784E)' }}>
                          {a.customerName ? a.customerName.charAt(0).toUpperCase() : a.customerId.slice(-2)}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: '#5D4037' }}>{a.customerName || a.customerId}</p>
                          {a.customerName && (
                            <p className="text-xs font-mono" style={{ color: '#A08880' }}>{a.customerId}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {a.value != null ? (
                        <span className="text-base font-semibold" style={{ color: '#5D4037' }}>₹{Number(a.value).toFixed(2)}</span>
                      ) : (
                        <span className="text-sm" style={{ color: '#A08880' }}>—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#7B5E54' }}>
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                        style={a.status === 'APPROVED'
                          ? { background: '#E4F2EB', color: '#2A6040', border: '1px solid rgba(42,96,64,0.2)' }
                          : { background: '#FDEEE9', color: '#B03A2A', border: '1px solid rgba(176,58,42,0.2)' }
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
              <div key={a.id} className="p-4 transition-colors" style={{ borderBottom: idx < filteredActivities.length - 1 ? '1px solid #FAECE7' : 'none' }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #D85A30, #E8784E)' }}>
                    {a.customerName ? a.customerName.charAt(0).toUpperCase() : a.customerId.slice(-2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold" style={{ color: '#5D4037' }}>{a.customerName || a.customerId}</p>
                    {a.customerName && (
                      <p className="text-xs font-mono" style={{ color: '#A08880' }}>{a.customerId}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: '#A08880' }}>{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                    style={a.status === 'APPROVED'
                      ? { background: '#E4F2EB', color: '#2A6040' }
                      : { background: '#FDEEE9', color: '#B03A2A' }
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
                  <div className="mt-2 p-2.5 rounded-lg" style={{ background: '#FAECE7' }}>
                    <p className="text-sm" style={{ color: '#5D4037' }}>
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
