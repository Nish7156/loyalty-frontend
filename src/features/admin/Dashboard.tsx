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

  if (loading) return <p className="text-sm md:text-base p-2" style={{ color: 'var(--t2)' }}>Loading…</p>;
  if (error) return <p className="text-sm md:text-base p-2" style={{ color: 'var(--re)' }}>{error}</p>;

  return (
    <div className="min-w-0">
      <h1 className="text-lg font-bold mb-3 md:text-2xl md:mb-4" style={{ color: 'var(--t)' }}>Admin Dashboard</h1>
      <div className="rounded-lg p-3 md:p-4 overflow-hidden" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
        <h2 className="font-semibold mb-2 text-sm md:text-base" style={{ color: 'var(--t)' }}>Stores ({partners.length})</h2>
        <ul className="min-w-0" style={{ borderColor: 'var(--bdl)' }}>
          {partners.map((p, idx) => (
            <li key={p.id} className="py-2.5 flex flex-wrap justify-between gap-1 items-center" style={{ borderBottom: idx < partners.length - 1 ? '1px solid var(--bdl)' : 'none' }}>
              <span className="font-medium truncate min-w-0" style={{ color: 'var(--t)' }}>{p.businessName}</span>
              <span className="text-xs md:text-sm shrink-0 truncate max-w-[50%]" style={{ color: 'var(--t3)' }}>{p.owner?.phone ?? ''}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
