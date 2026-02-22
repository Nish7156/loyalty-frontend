import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { activityApi, rewardsApi } from '../../lib/api';
import { createBranchSocket } from '../../lib/socket';
import type { Activity, Reward } from '../../lib/api';
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
  const [pendingRewards, setPendingRewards] = useState<Reward[]>([]);
  const [completingCode, setCompletingCode] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');

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
    rewardsApi.pendingRedemptions()
      .then(setPendingRewards)
      .catch(() => setPendingRewards([]));
  }, [branchId]);

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

  const handleCompleteReward = useCallback(async (code: string) => {
    if (!code) return;
    setCompletingCode(code);
    setError('');
    try {
      await rewardsApi.completeByCode(code);
      setPendingRewards((prev) => prev.filter((r) => r.redemptionCode !== code));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete');
    } finally {
      setCompletingCode(null);
    }
  }, []);

  if (loading) return <p className="text-gray-600">Loading…</p>;
  if (error) return <p className="text-red-600 text-sm mb-2">{error}</p>;

  return (
    <div className="min-w-0">
      <h1 className="text-lg font-bold mb-3 md:text-xl md:mb-4">Pending Check-ins</h1>
      <p className="text-gray-500 text-sm mb-4">Use Approve, Edit amount, or Reject — no need to open another page.</p>
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
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <label className="sr-only">Amount (edit to override)</label>
                    <input
                      ref={(el) => { amountInputRefs.current[a.id] = el; }}
                      type="number"
                      step="0.01"
                      min="0"
                      value={override}
                      onChange={(e) => setAmountOverrides((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      placeholder="Amount"
                      className="w-24 min-h-[44px] rounded-lg border border-gray-300 px-3 text-sm"
                      aria-label="Amount"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleStatus(a.id, 'APPROVED')}
                      disabled={isSubmitting}
                      className="min-h-[44px] flex-1 min-w-[100px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                    >
                      {isSubmitting ? '…' : 'Approve'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => amountInputRefs.current[a.id]?.focus()}
                      disabled={isSubmitting}
                      className="min-h-[44px] flex-1 min-w-[100px]"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleRejectClick(a.id)}
                      disabled={isSubmitting}
                      className="min-h-[44px] flex-1 min-w-[100px]"
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

      <h2 className="text-base font-bold mt-6 mb-2">Reward claims</h2>
      <p className="text-gray-500 text-sm mb-3">Customer shows their code; mark complete when you have given the reward.</p>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 8))}
          placeholder="Enter code"
          className="min-h-[44px] w-32 rounded-lg border border-gray-300 px-3 font-mono uppercase"
          maxLength={8}
        />
        <Button
          onClick={() => {
            const c = codeInput.trim().toUpperCase();
            if (c) {
              handleCompleteReward(c);
              setCodeInput('');
            }
          }}
          disabled={!codeInput.trim() || completingCode !== null}
          className="min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          {completingCode ? '…' : 'Complete by code'}
        </Button>
      </div>
      {pendingRewards.length === 0 ? (
        <p className="text-gray-500 text-sm">No pending reward claims.</p>
      ) : (
        <ul className="space-y-3">
          {pendingRewards.map((r) => {
            const code = r.redemptionCode ?? '';
            const isCompleting = completingCode === code;
            return (
              <li key={r.id} className="bg-white rounded-xl shadow border border-gray-100 p-4 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono font-semibold text-gray-900">{code}</p>
                  <p className="text-gray-600 text-sm">{r.customerId}</p>
                  {r.customer?.name && <p className="text-gray-500 text-sm">{r.customer.name}</p>}
                  <p className="text-gray-500 text-xs mt-0.5">{r.partner?.businessName}</p>
                </div>
                <Button
                  onClick={() => handleCompleteReward(code)}
                  disabled={isCompleting}
                  className="min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium shrink-0"
                >
                  {isCompleting ? '…' : 'Mark complete'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {rejectConfirmId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Confirm reject">
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={() => setRejectConfirmId(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-5 max-w-sm w-full">
            <p className="text-gray-900 font-medium">Reject this check-in?</p>
            <p className="text-gray-500 text-sm mt-1">The customer will not get this visit approved.</p>
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" onClick={() => setRejectConfirmId(null)} className="flex-1 min-h-[44px]">
                Cancel
              </Button>
              <Button variant="danger" onClick={handleRejectConfirm} disabled={submittingId !== null} className="flex-1 min-h-[44px]">
                {submittingId === rejectConfirmId ? '…' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
