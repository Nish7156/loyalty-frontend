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
        <div className="text-center py-16 rounded-xl" style={{ background: '#FFF', border: '1px solid #FAECE7' }}>
          <span className="material-symbols-rounded" style={{ fontSize: '64px', color: '#A08880' }}>search</span>
          <p className="text-lg font-medium mb-4" style={{ color: '#7B5E54' }}>No check-in selected</p>
          <Button className="min-h-[48px] px-6" onClick={() => navigate('/seller/dashboard')} style={{ background: '#D85A30', color: '#FFF' }}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (loading) return <p className="text-sm" style={{ color: '#7B5E54' }}>Loading…</p>;
  if (error && !activity) return <p className="text-sm" style={{ color: '#B03A2A' }}>{error}</p>;
  if (!activity) return null;

  const requestedAmount = activity.value != null ? Number(activity.value) : null;
  const displayAmount = amount || (requestedAmount != null ? String(requestedAmount) : '');

  return (
    <div className="min-w-0 max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24" style={{ background: '#FAF9F6' }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#5D4037' }}>Approve Check-in</h1>
        <p style={{ color: '#7B5E54' }}>Review and process customer check-in request</p>
      </div>

      <div className="rounded-2xl p-6 mb-6" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, #D85A30, #E8784E)' }}>
            {activity.customerName ? activity.customerName.charAt(0).toUpperCase() : activity.customerId.slice(-2)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold" style={{ color: '#5D4037' }}>
              {activity.customerName || 'Customer Check-in'}
            </h2>
            <p className="text-sm font-mono mt-1" style={{ color: '#7B5E54' }}>{activity.customerId}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg" style={{ background: '#FAECE7', border: '1px solid #F5C4B3' }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#7B5E54' }}>Branch</p>
            <p className="text-base font-semibold" style={{ color: '#5D4037' }}>
              {activity.branch?.branchName ?? activity.branchId}
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ background: '#FAECE7', border: '1px solid #F5C4B3' }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#7B5E54' }}>Check-in Time</p>
            <p className="text-base font-semibold" style={{ color: '#5D4037' }}>
              {new Date(activity.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {requestedAmount != null && (
          <div className="mt-4 p-4 rounded-lg" style={{ background: '#FAECE7', border: '1px solid #F5C4B3' }}>
            <p className="text-sm" style={{ color: '#5D4037' }}>
              <span className="font-medium">Requested Amount:</span>{' '}
              <span className="text-2xl font-bold ml-2">₹{requestedAmount.toFixed(2)}</span>
            </p>
          </div>
        )}

        {activity.locationFlagDistant && (
          <div className="mt-4 p-4 rounded-lg flex items-start gap-3" style={{ background: '#FFF8E1', border: '1px solid #FFE082' }}>
            <span className="material-symbols-rounded" style={{ color: '#F9A825', fontSize: '24px' }}>warning</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#5D4037' }}>Location Alert</p>
              <p className="text-sm mt-1" style={{ color: '#7B5E54' }}>Customer may be outside normal range</p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-6 mb-6" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#5D4037' }}>Transaction Details</h3>
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
          <p className="text-xs mt-2" style={{ color: '#A08880' }}>Cross-check with request and confirm or override</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg text-sm" style={{ background: '#FDEEE9', border: '1px solid #F5C4B3', color: '#B03A2A' }}>
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() => handleStatus('APPROVED')}
          disabled={submitting}
          className="min-h-[52px] px-8 flex-1 md:flex-none font-semibold text-base"
          style={{ background: '#2A6040', color: '#FFF' }}
        >
          <span className="material-symbols-rounded mr-1" style={{ fontSize: '18px' }}>check</span>
          {submitting ? 'Processing...' : 'Approve Check-in'}
        </Button>
        <Button
          variant="danger"
          onClick={() => handleStatus('REJECTED')}
          disabled={submitting}
          className="min-h-[52px] px-8 flex-1 md:flex-none"
          style={{ background: '#B03A2A', color: '#FFF' }}
        >
          <span className="material-symbols-rounded mr-1" style={{ fontSize: '18px' }}>close</span>
          Reject
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/seller/dashboard')}
          className="min-h-[52px] px-8 flex-1 md:flex-none"
          style={{ border: '1px solid #F5C4B3', color: '#5D4037' }}
        >
          <span className="material-symbols-rounded mr-1" style={{ fontSize: '18px' }}>arrow_back</span>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
