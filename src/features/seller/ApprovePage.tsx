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
      <div className="min-w-0 max-w-2xl mx-auto">
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-500 text-lg font-medium mb-4">No check-in selected</p>
          <Button className="min-h-[48px] px-6" onClick={() => navigate('/seller/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (loading) return <p className="text-sm">Loading…</p>;
  if (error && !activity) return <p className="text-red-600 text-sm">{error}</p>;
  if (!activity) return null;

  const requestedAmount = activity.value != null ? Number(activity.value) : null;
  const displayAmount = amount || (requestedAmount != null ? String(requestedAmount) : '');

  return (
    <div className="min-w-0 max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Approve Check-in</h1>
        <p className="text-gray-600">Review and process customer check-in request</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {activity.customerName ? activity.customerName.charAt(0).toUpperCase() : activity.customerId.slice(-2)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900">
              {activity.customerName || 'Customer Check-in'}
            </h2>
            <p className="text-sm text-gray-500 font-mono mt-1">{activity.customerId}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Branch</p>
            <p className="text-base font-semibold text-gray-900">
              {activity.branch?.branchName ?? activity.branchId}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-gray-50 to-purple-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Check-in Time</p>
            <p className="text-base font-semibold text-gray-900">
              {new Date(activity.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {requestedAmount != null && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Requested Amount:</span>{' '}
              <span className="text-2xl font-bold ml-2">₹{requestedAmount.toFixed(2)}</span>
            </p>
          </div>
        )}

        {activity.locationFlagDistant && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <span className="text-amber-600 text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-900">Location Alert</p>
              <p className="text-sm text-amber-800 mt-1">Customer may be outside normal range</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
        <div className="mb-2">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            value={displayAmount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="text-lg"
          />
          <p className="text-xs text-gray-500 mt-2">Cross-check with request and confirm or override</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() => handleStatus('APPROVED')}
          disabled={submitting}
          className="min-h-[52px] px-8 flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base"
        >
          {submitting ? 'Processing...' : '✓ Approve Check-in'}
        </Button>
        <Button
          variant="danger"
          onClick={() => handleStatus('REJECTED')}
          disabled={submitting}
          className="min-h-[52px] px-8 flex-1 md:flex-none"
        >
          ✕ Reject
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/seller/dashboard')}
          className="min-h-[52px] px-8 flex-1 md:flex-none"
        >
          ← Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
