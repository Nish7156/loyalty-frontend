import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { activityApi } from '../../lib/api';
import type { Activity } from '../../lib/api';

export function SellerHistory() {
  const { auth } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">History</h1>
      {activities.length === 0 ? (
        <p className="text-gray-500">No history yet.</p>
      ) : (
        <ul className="space-y-2">
          {activities.map((a) => (
            <li key={a.id} className="bg-white rounded-lg shadow p-3 flex justify-between items-center">
              <div>
                <span className="font-medium">{a.customerId}</span>
                {a.value != null && <span className="text-gray-500 ml-2">${Number(a.value).toFixed(2)}</span>}
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`text-sm font-medium px-2 py-0.5 rounded ${
                  a.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {a.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
