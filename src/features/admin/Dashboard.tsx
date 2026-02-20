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

  if (loading) return <p className="text-sm md:text-base p-2">Loading…</p>;
  if (error) return <p className="text-red-600 text-sm md:text-base p-2">{error}</p>;

  return (
    <div className="min-w-0">
      <h1 className="text-lg font-bold mb-3 md:text-2xl md:mb-4">Admin Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-3 md:p-4 overflow-hidden">
        <h2 className="font-semibold mb-2 text-sm md:text-base">Stores ({partners.length})</h2>
        <ul className="divide-y divide-gray-100 min-w-0">
          {partners.map((p) => (
            <li key={p.id} className="py-2.5 flex flex-wrap justify-between gap-1 items-center">
              <span className="font-medium truncate min-w-0">{p.businessName}</span>
              <span className="text-gray-500 text-xs md:text-sm shrink-0 truncate max-w-[50%]">{p.owner?.phone ?? ''}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
