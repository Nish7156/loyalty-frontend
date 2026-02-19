import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { activityApi } from '../../lib/api';
import type { Activity } from '../../lib/api';
import { Button } from '../../components/Button';

export function ApprovePage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    activityApi
      .get(id)
      .then(setActivity)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatus = async (status: 'APPROVED' | 'REJECTED') => {
    if (!id) return;
    setSubmitting(true);
    setError('');
    try {
      await activityApi.updateStatus(id, status);
      navigate('/seller/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) {
    return (
      <div>
        <p className="text-gray-500">No check-in selected.</p>
        <Button className="mt-2" onClick={() => navigate('/seller/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }
  if (loading) return <p>Loading…</p>;
  if (error && !activity) return <p className="text-red-600">{error}</p>;
  if (!activity) return null;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Approve Check-in</h1>
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <p><strong>Customer:</strong> {activity.customerId}</p>
        <p><strong>Amount:</strong> {activity.value != null ? `$${Number(activity.value).toFixed(2)}` : '—'}</p>
        <p><strong>Branch:</strong> {activity.branch?.branchName ?? activity.branchId}</p>
      </div>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={() => handleStatus('APPROVED')} disabled={submitting}>
          Approve
        </Button>
        <Button variant="danger" onClick={() => handleStatus('REJECTED')} disabled={submitting}>
          Reject
        </Button>
        <Button variant="secondary" onClick={() => navigate('/seller/dashboard')}>
          Back
        </Button>
      </div>
    </div>
  );
}
