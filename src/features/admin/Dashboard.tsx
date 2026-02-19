import { useEffect, useState } from 'react';
import { partnersApi } from '../../lib/api';
import type { Partner } from '../../lib/api';

export function AdminDashboard() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    partnersApi
      .list()
      .then(setPartners)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-2">Partners ({partners.length})</h2>
        <ul className="divide-y">
          {partners.map((p) => (
            <li key={p.id} className="py-2 flex justify-between">
              <span>{p.businessName}</span>
              <span className="text-gray-500">{p.industryType}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
