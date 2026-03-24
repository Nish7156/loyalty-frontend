import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { activityApi } from '../../lib/api';
import { createBranchSocket } from '../../lib/socket';
import type { Activity } from '../../lib/api';
import { Button } from '../../components/Button';

function normalizeActivity(p: unknown): Activity {
  const a = p as Record<string, unknown>;
  return {
    id: String(a.id),
    customerId: String(a.customerId),
    branchId: String(a.branchId),
    staffId: a.staffId != null ? String(a.staffId) : null,
    status: (a.status as Activity['status']) || 'PENDING',
    value: a.value != null ? Number(a.value) : undefined,
    requestLocation: a.requestLocation as Activity['requestLocation'],
    createdAt: String(a.createdAt),
    customer: a.customer as Activity['customer'],
    branch: a.branch as Activity['branch'],
    staff: a.staff as Activity['staff'],
    locationFlagDistant: a.locationFlagDistant as boolean | undefined,
    customerName: a.customerName != null ? String(a.customerName) : undefined,
  };
}

export function SellerDashboard() {
  const { auth } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [rejectConfirmId, setRejectConfirmId] = useState<string | null>(null);
  const [amountOverrides, setAmountOverrides] = useState<Record<string, string>>({});
  const amountInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const branchId = auth.type === 'staff' ? auth.staff.branchId : '';

  const fetchList = useCallback(() => {
    if (!branchId) return;
    activityApi
      .list()
      .then((list) => setActivities(list.filter((a) => a.branchId === branchId && a.status === 'PENDING')))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [branchId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!branchId) return;
    const socket = createBranchSocket(branchId);

    socket.on('connect', () => {
      socket.emit('join_branch', { branchId });
    });

    socket.on('new_checkin_request', (payload: unknown) => {
      const activity = normalizeActivity(payload);
      if (activity.branchId === branchId && activity.status === 'PENDING') {
        setActivities((prev) => {
          if (prev.some((a) => a.id === activity.id)) return prev;
          return [activity, ...prev];
        });
      }
    });

    socket.on('checkin_updated', (payload: { id: string; status: string }) => {
      if (payload.status !== 'PENDING') {
        setActivities((prev) => prev.filter((a) => a.id !== payload.id));
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [branchId]);

  const handleStatus = useCallback(async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setSubmittingId(id);
    setError('');
    try {
      const a = activities.find((x) => x.id === id);
      const amountStr = amountOverrides[id]?.trim();
      const value = status === 'APPROVED'
        ? (amountStr ? Number(amountStr) : a?.value != null ? Number(a.value) : undefined)
        : undefined;
      await activityApi.updateStatus(id, status, value);
      setActivities((prev) => prev.filter((x) => x.id !== id));
      setAmountOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmittingId(null);
      setRejectConfirmId(null);
    }
  }, [activities, amountOverrides]);

  const handleRejectClick = (id: string) => setRejectConfirmId(id);
  const handleRejectConfirm = () => {
    if (rejectConfirmId) {
      handleStatus(rejectConfirmId, 'REJECTED');
    }
  };

  if (loading) return <p style={{ color: '#7B5E54' }}>Loading…</p>;

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24" style={{ background: '#FAF9F6' }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#5D4037' }}>Pending Check-ins</h1>
        <p style={{ color: '#7B5E54' }}>Approve, edit amount, or reject customer check-ins</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm" style={{ background: '#FDEEE9', border: '1px solid #F5C4B3', color: '#B03A2A' }}>
          {error}
        </div>
      )}

      {activities.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: '#FFF', border: '1px solid #FAECE7' }}>
          <div className="text-6xl mb-4">
            <span className="material-symbols-rounded" style={{ fontSize: '64px', color: '#2A6040' }}>check_circle</span>
          </div>
          <p className="text-lg font-medium mb-2" style={{ color: '#7B5E54' }}>All caught up!</p>
          <p className="text-sm" style={{ color: '#A08880' }}>No pending check-ins at the moment</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 lg:gap-6">
          {activities.map((a) => {
            const requestedAmount = a.value != null ? Number(a.value) : null;
            const override = amountOverrides[a.id] ?? (requestedAmount != null ? String(requestedAmount) : '');
            const isSubmitting = submittingId === a.id;
            return (
              <div key={a.id} className="rounded-2xl overflow-hidden transition-shadow hover:shadow-md" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: 'linear-gradient(135deg, #D85A30, #E8784E)' }}>
                      {a.customerName ? a.customerName.charAt(0).toUpperCase() : a.customerId.slice(-2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate" style={{ color: '#5D4037' }}>
                        {a.customerName || a.customerId}
                      </h3>
                      {a.customerName && (
                        <p className="text-sm font-mono" style={{ color: '#7B5E54' }}>{a.customerId}</p>
                      )}
                      <p className="text-xs mt-1" style={{ color: '#A08880' }}>
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {requestedAmount != null && (
                    <div className="mb-4 p-3 rounded-lg" style={{ background: '#FAECE7', border: '1px solid #F5C4B3' }}>
                      <p className="text-sm" style={{ color: '#5D4037' }}>
                        <span className="font-medium">Requested Amount:</span>{' '}
                        <span className="text-lg font-bold">₹{requestedAmount.toFixed(2)}</span>
                      </p>
                    </div>
                  )}

                  {a.locationFlagDistant && (
                    <div className="mb-4 p-3 rounded-lg flex items-start gap-2" style={{ background: '#FFF8E1', border: '1px solid #FFE082' }}>
                      <span className="material-symbols-rounded" style={{ color: '#F9A825', fontSize: '20px' }}>warning</span>
                      <p className="text-sm" style={{ color: '#5D4037' }}>
                        <span className="font-medium">Location Alert:</span> Customer may be outside normal range
                      </p>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#5D4037' }}>
                      Transaction Amount
                    </label>
                    <input
                      ref={(el) => { amountInputRefs.current[a.id] = el; }}
                      type="number"
                      step="0.01"
                      min="0"
                      value={override}
                      onChange={(e) => setAmountOverrides((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      placeholder="Enter amount"
                      className="w-full md:w-64 min-h-[44px] rounded-lg px-4 text-base focus:outline-none focus:ring-2"
                      style={{ border: '1px solid #F5C4B3', color: '#5D4037', background: '#FFF' }}
                      aria-label="Transaction amount"
                    />
                    <p className="text-xs mt-1" style={{ color: '#A08880' }}>Edit to override the requested amount</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleStatus(a.id, 'APPROVED')}
                      disabled={isSubmitting}
                      className="min-h-[48px] px-6 flex-1 md:flex-none font-semibold text-base"
                      style={{ background: '#2A6040', color: '#FFF' }}
                    >
                      <span className="material-symbols-rounded mr-1" style={{ fontSize: '18px' }}>check</span>
                      {isSubmitting ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => amountInputRefs.current[a.id]?.focus()}
                      disabled={isSubmitting}
                      className="min-h-[48px] px-6 flex-1 md:flex-none"
                      style={{ border: '1px solid #F5C4B3', color: '#5D4037' }}
                    >
                      <span className="material-symbols-rounded mr-1" style={{ fontSize: '18px' }}>edit</span>
                      Edit Amount
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleRejectClick(a.id)}
                      disabled={isSubmitting}
                      className="min-h-[48px] px-6 flex-1 md:flex-none"
                      style={{ background: '#B03A2A', color: '#FFF' }}
                    >
                      <span className="material-symbols-rounded mr-1" style={{ fontSize: '18px' }}>close</span>
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Confirm reject">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" onClick={() => setRejectConfirmId(null)} />
          <div className="relative rounded-2xl shadow-2xl p-6 max-w-md w-full" style={{ background: '#FFF', border: '1px solid #FAECE7' }}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#FDEEE9' }}>
                <span className="material-symbols-rounded" style={{ color: '#B03A2A', fontSize: '24px' }}>warning</span>
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: '#5D4037' }}>Reject Check-in?</h3>
                <p className="text-sm mt-1" style={{ color: '#7B5E54' }}>The customer will not get this visit approved. This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setRejectConfirmId(null)}
                className="flex-1 min-h-[48px]"
                style={{ border: '1px solid #F5C4B3', color: '#5D4037' }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleRejectConfirm}
                disabled={submittingId !== null}
                className="flex-1 min-h-[48px]"
                style={{ background: '#B03A2A', color: '#FFF' }}
              >
                {submittingId === rejectConfirmId ? 'Rejecting...' : 'Reject Check-in'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
