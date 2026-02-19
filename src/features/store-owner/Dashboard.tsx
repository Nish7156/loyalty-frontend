import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { partnersApi, branchesApi } from '../../lib/api';
import type { Partner } from '../../lib/api';
import type { Branch } from '../../lib/api';

export function OwnerDashboard() {
  const { auth } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([partnersApi.list(), branchesApi.list()])
      .then(([p, b]) => {
        setPartners(p);
        setBranches(b);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  const myPartners = auth.type === 'platform' ? partners.filter((p) => p.ownerId === auth.user.id) : partners;
  const myBranches = branches.filter((b) => myPartners.some((p) => p.id === b.partnerId));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Owner Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">My Store</h2>
          <ul className="divide-y">
            {myPartners.map((p) => (
              <li key={p.id} className="py-2">{p.businessName} — {p.industryType}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">Branches ({myBranches.length})</h2>
          <ul className="divide-y">
            {myBranches.map((b) => (
              <li key={b.id} className="py-2">{b.branchName}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
