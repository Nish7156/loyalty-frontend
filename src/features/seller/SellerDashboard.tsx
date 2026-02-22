import { useEffect, useState, useCallback } from 'react';
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
  const [amountOverrides, setAmountOverrides] = useState<Record<string, string>>({});

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
    }
  }, [activities, amountOverrides]);

  if (loading) return <p className="text-gray-600">Loading…</p>;
  if (error) return <p className="text-red-600 text-sm mb-2">{error}</p>;

  return (
    <div className="min-w-0">
      <h1 className="text-lg font-bold mb-3 md:text-xl md:mb-4">Pending Check-ins</h1>
      <p className="text-gray-500 text-sm mb-4">Approve or reject in one tap. Optionally edit amount before approving.</p>
      {activities.length === 0 ? (
        <p className="text-gray-500 text-sm">No pending check-ins.</p>
      ) : (
        <ul className="space-y-4">
          {activities.map((a) => {
            const requestedAmount = a.value != null ? Number(a.value) : null;
            const override = amountOverrides[a.id] ?? (requestedAmount != null ? String(requestedAmount) : '');
            const isSubmitting = submittingId === a.id;
            return (
              <li key={a.id} className="bg-white rounded-xl shadow border border-gray-100 p-4 min-w-0">
                <div className="flex flex-col gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{a.customerId}</p>
                    {a.customerName && <p className="text-gray-600 text-sm mt-0.5">{a.customerName}</p>}
                    {requestedAmount != null && (
                      <p className="text-gray-500 text-xs mt-1">Requested: ${requestedAmount.toFixed(2)}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={override}
                      onChange={(e) => setAmountOverrides((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      placeholder="Amount"
                      className="w-24 min-h-[44px] rounded-lg border border-gray-300 px-3 text-sm"
                    />
                    <Button
                      onClick={() => handleStatus(a.id, 'APPROVED')}
                      disabled={isSubmitting}
                      className="min-h-[44px] flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                    >
                      {isSubmitting ? '…' : 'Approve'}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleStatus(a.id, 'REJECTED')}
                      disabled={isSubmitting}
                      className="min-h-[44px] flex-1 sm:flex-none"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
