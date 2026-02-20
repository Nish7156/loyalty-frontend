import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { activityApi } from '../../lib/api';
import type { Activity } from '../../lib/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export function ApprovePage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    activityApi
      .get(id)
      .then((a) => {
        setActivity(a);
        setAmount(a.value != null ? String(Number(a.value)) : '');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatus = async (status: 'APPROVED' | 'REJECTED') => {
    if (!id) return;
    setSubmitting(true);
    setError('');
    try {
      const value = status === 'APPROVED' && amount.trim() ? Number(amount) : undefined;
      await activityApi.updateStatus(id, status, value);
      navigate('/seller/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) {
    return (
      <div className="min-w-0">
        <p className="text-gray-500 text-sm">No check-in selected.</p>
        <Button className="mt-2 min-h-[44px] w-full sm:w-auto" onClick={() => navigate('/seller/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }
  if (loading) return <p className="text-sm">Loading…</p>;
  if (error && !activity) return <p className="text-red-600 text-sm">{error}</p>;
  if (!activity) return null;

  const requestedAmount = activity.value != null ? Number(activity.value) : null;
  const displayAmount = amount || (requestedAmount != null ? String(requestedAmount) : '');

  return (
    <div className="min-w-0">
      <h1 className="text-lg font-bold mb-3 md:text-xl md:mb-4">Approve Check-in</h1>
      <div className="bg-white rounded-lg shadow p-3 mb-3 md:p-4 md:mb-4">
        <p className="text-sm md:text-base break-all"><strong>Customer:</strong> {activity.customerId}</p>
        <p className="text-sm md:text-base mt-1"><strong>Branch:</strong> {activity.branch?.branchName ?? activity.branchId}</p>
        {requestedAmount != null && (
          <p className="text-sm text-gray-600 mt-1">Requested amount: ${requestedAmount.toFixed(2)}</p>
        )}
      </div>
      <div className="mb-4">
        <Input
          label="Amount (cross-check with request, confirm or override)"
          type="number"
          step="0.01"
          min="0"
          value={displayAmount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
      </div>
      {error && <p className="text-red-600 mb-2 text-sm">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => handleStatus('APPROVED')} disabled={submitting} className="min-h-[44px] flex-1 sm:flex-none">
          Approve
        </Button>
        <Button variant="danger" onClick={() => handleStatus('REJECTED')} disabled={submitting} className="min-h-[44px] flex-1 sm:flex-none">
          Reject
        </Button>
        <Button variant="secondary" onClick={() => navigate('/seller/dashboard')} className="min-h-[44px] flex-1 sm:flex-none">
          Back
        </Button>
      </div>
    </div>
  );
}
