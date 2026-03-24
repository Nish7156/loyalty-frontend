import { useEffect, useState } from 'react';
import { customersApi } from '../../lib/api';
import { HistorySkeleton } from '../../components/Skeleton';
import type { CustomerHistory, HistoryActivity, HistoryRedeemedReward } from '../../lib/api';

function formatDateTime(s: string) {
  try {
    return new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return s;
  }
}

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return s;
  }
}

type StoreHistory = {
  partnerId: string;
  partnerName: string;
  visits: HistoryActivity[];
  redeemed: HistoryRedeemedReward[];
};

function groupHistoryByStore(history: CustomerHistory): StoreHistory[] {
  const byPartner = new Map<string, StoreHistory>();

  for (const a of history.activities) {
    const id = a.partner?.id ?? (a.branch as { partnerId?: string })?.partnerId ?? a.branchId;
    const name = a.partner?.businessName ?? 'Store';
    if (!byPartner.has(id)) {
      byPartner.set(id, { partnerId: id, partnerName: name, visits: [], redeemed: [] });
    }
    byPartner.get(id)!.visits.push(a);
  }

  for (const r of history.redeemedRewards) {
    const id = r.partnerId;
    if (!byPartner.has(id)) {
      byPartner.set(id, { partnerId: id, partnerName: r.partner?.businessName ?? 'Store', visits: [], redeemed: [] });
    }
    byPartner.get(id)!.redeemed.push(r);
  }

  const list = Array.from(byPartner.values());
  list.forEach((s) => {
    s.visits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    s.redeemed.sort((a, b) => {
      const da = a.redeemedAt ?? a.createdAt;
      const db = b.redeemedAt ?? b.createdAt;
      return new Date(db).getTime() - new Date(da).getTime();
    });
  });
  list.sort((a, b) => {
    const aLatest = Math.max(...a.visits.map((v) => new Date(v.createdAt).getTime()), ...a.redeemed.map((r) => new Date(r.redeemedAt ?? r.createdAt).getTime()), 0);
    const bLatest = Math.max(...b.visits.map((v) => new Date(v.createdAt).getTime()), ...b.redeemed.map((r) => new Date(r.redeemedAt ?? r.createdAt).getTime()), 0);
    return bLatest - aLatest;
  });
  return list;
}

export function UserHistoryPage() {
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    customersApi
      .getMyHistory()
      .then(setHistory)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load history'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-md mx-auto w-full min-w-0"><HistorySkeleton /></div>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 py-8">
        <h1 className="text-xl font-bold mb-4" style={{ color: '#5D4037' }}>History</h1>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm" style={{ color: '#B03A2A' }}>{error}</p>
        </div>
      </div>
    );
  }

  const stores = history && (history.activities.length > 0 || history.redeemedRewards.length > 0) ? groupHistoryByStore(history) : [];

  return (
    <div className="max-w-md mx-auto space-y-5 pb-8 w-full min-w-0" style={{ paddingTop: '20px' }}>
      <div className="a1">
        <h1 className="text-[22px] font-bold" style={{ color: '#5D4037', letterSpacing: '-0.02em' }}>History</h1>
        <p className="text-sm mt-0.5" style={{ color: '#7B5E54' }}>Your visits and redeemed rewards by store.</p>
      </div>

      {stores.length === 0 ? (
        <div className="glass-card rounded-2xl p-5 a2">
          <p className="text-sm" style={{ color: '#7B5E54' }}>No history yet. Scan a store QR to check in — your visits and rewards will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stores.map((store, storeIdx) => (
            <div key={store.partnerId} className={`glass-card rounded-2xl overflow-hidden ${storeIdx < 2 ? 'a2' : ''}`}>
              {/* Store header */}
              <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #FAECE7' }}>
                <h2 className="text-base font-semibold" style={{ color: '#5D4037' }}>{store.partnerName}</h2>
                <p className="text-xs mt-0.5" style={{ color: '#A08880' }}>
                  {store.visits.length} visit{store.visits.length !== 1 ? 's' : ''}
                  {store.redeemed.length > 0 && ` · ${store.redeemed.length} reward${store.redeemed.length !== 1 ? 's' : ''} redeemed`}
                </p>
              </div>

              {/* Visits */}
              {store.visits.length > 0 && (
                <div style={{ padding: '12px 18px' }}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-2" style={{ color: '#A08880' }}>Visits</h3>
                  <ul className="user-history-visits-list max-h-[260px] overflow-y-auto">
                    {store.visits.map((a) => (
                      <li key={a.id} className="flex items-start gap-3 py-2" style={{ borderBottom: '1px solid #FAECE7' }}>
                        <div className="shrink-0 flex items-center justify-center mt-0.5" style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E4F2EB' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: '14px', color: '#2A6040' }}>check</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium" style={{ color: '#5D4037' }}>{a.branch?.branchName ?? 'Check-in'}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: '#A08880' }}>{formatDateTime(a.createdAt)}</p>
                          {a.value != null && a.value > 0 && (
                            <p className="text-[11px] mt-0.5" style={{ color: '#A08880' }}>Amount: {a.value}</p>
                          )}
                        </div>
                        {a.value != null && a.value > 0 && (
                          <span className="text-[13px] font-semibold shrink-0" style={{ color: '#2A6040' }}>+{a.value}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Redeemed rewards */}
              {store.redeemed.length > 0 && (
                <div style={{ padding: '12px 18px', borderTop: store.visits.length > 0 ? '1px solid #FAECE7' : 'none' }}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-2" style={{ color: '#A08880' }}>Redeemed rewards</h3>
                  <ul>
                    {store.redeemed.slice(0, 10).map((r) => (
                      <li key={r.id} className="flex items-start gap-3 py-2" style={{ borderBottom: '1px solid #FAECE7' }}>
                        <div className="shrink-0 flex items-center justify-center mt-0.5" style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FAECE7' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: '14px', color: '#D85A30' }}>redeem</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium" style={{ color: '#5D4037' }}>{r.redeemedBranch?.branchName ?? 'Reward'}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: '#A08880' }}>{r.redeemedAt ? formatDateTime(r.redeemedAt) : formatDate(r.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {store.redeemed.length > 10 && (
                    <p className="text-[11px] mt-2" style={{ color: '#A08880' }}>+{store.redeemed.length - 10} more redeemed</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
