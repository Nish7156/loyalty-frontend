import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customersApi, getCustomerTokenIfPresent } from '../../lib/api';
import { Loader } from '../../components/Loader';
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
      byPartner.set(id, {
        partnerId: id,
        partnerName: r.partner?.businessName ?? 'Store',
        visits: [],
        redeemed: [],
      });
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
    const aLatest = Math.max(
      ...a.visits.map((v) => new Date(v.createdAt).getTime()),
      ...a.redeemed.map((r) => new Date(r.redeemedAt ?? r.createdAt).getTime()),
      0
    );
    const bLatest = Math.max(
      ...b.visits.map((v) => new Date(v.createdAt).getTime()),
      ...b.redeemed.map((r) => new Date(r.redeemedAt ?? r.createdAt).getTime()),
      0
    );
    return bLatest - aLatest;
  });
  return list;
}

export function UserHistoryPage() {
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getCustomerTokenIfPresent()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    customersApi
      .getMyHistory()
      .then(setHistory)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load history'))
      .finally(() => setLoading(false));
  }, []);

  const isLoggedIn = !!getCustomerTokenIfPresent();
  const cardClass = 'rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 shadow-[0_0_30px_-10px_rgba(0,0,0,0.3)]';
  const sectionTitleClass = 'text-sm font-semibold text-white/90 uppercase tracking-wider mb-2';
  const descClass = 'text-white/60 text-sm';
  const itemClass = 'flex items-start gap-3 py-2.5 border-b border-white/10 last:border-0';

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-transparent tracking-tight">
          History
        </h1>
        <p className="text-white/60 text-sm mb-6">Log in to see your visits and rewards history.</p>
        <div className={cardClass}>
          <Link
            to="/"
            className="flex w-full min-h-[48px] rounded-xl border border-white/40 text-white font-medium items-center justify-center hover:bg-white/10 transition"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 min-h-[50vh] flex items-center justify-center">
        <Loader message="Loading history…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-transparent tracking-tight">
          History
        </h1>
        <div className={cardClass}>
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const stores = history && (history.activities.length > 0 || history.redeemedRewards.length > 0)
    ? groupHistoryByStore(history)
    : [];

  return (
    <div className="max-w-md mx-auto space-y-6 pb-8 w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-transparent tracking-tight">
        History
      </h1>
      <p className="text-white/60 text-sm">Your visits and redeemed rewards by store.</p>

      {stores.length === 0 ? (
        <div className={cardClass}>
          <p className={descClass}>No history yet. Scan a store QR to check in — your visits and rewards will appear here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {stores.map((store) => (
            <div key={store.partnerId} className={cardClass}>
              <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-cyan-200/80 bg-clip-text text-transparent mb-1">
                {store.partnerName}
              </h2>
              <p className={descClass}>
                {store.visits.length} visit{store.visits.length !== 1 ? 's' : ''}
                {store.redeemed.length > 0 && ` · ${store.redeemed.length} reward${store.redeemed.length !== 1 ? 's' : ''} redeemed`}
              </p>

              {store.visits.length > 0 && (
                <div className="mt-4">
                  <h3 className={sectionTitleClass}>Visits</h3>
                  <ul className="mt-1">
                    {store.visits.slice(0, 15).map((a) => (
                      <li key={a.id} className={itemClass}>
                        <span className="shrink-0 w-2 h-2 rounded-full mt-1.5 bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium">{a.branch?.branchName ?? 'Check-in'}</p>
                          <p className="text-white/50 text-xs mt-0.5">{formatDateTime(a.createdAt)}</p>
                          {a.value != null && a.value > 0 && (
                            <p className="text-white/40 text-xs mt-0.5">Amount: {a.value}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {store.visits.length > 15 && (
                    <p className="text-white/40 text-xs mt-2">+{store.visits.length - 15} more visits</p>
                  )}
                </div>
              )}

              {store.redeemed.length > 0 && (
                <div className={store.visits.length > 0 ? 'mt-5 pt-4 border-t border-white/10' : 'mt-4'}>
                  <h3 className={sectionTitleClass}>Redeemed rewards</h3>
                  <ul className="mt-1">
                    {store.redeemed.slice(0, 10).map((r) => (
                      <li key={r.id} className={itemClass}>
                        <span className="shrink-0 w-2 h-2 rounded-full mt-1.5 bg-emerald-400/80" />
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium">
                            {r.redeemedBranch?.branchName ?? 'Reward'}
                          </p>
                          <p className="text-white/50 text-xs mt-0.5">
                            {r.redeemedAt ? formatDateTime(r.redeemedAt) : formatDate(r.createdAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {store.redeemed.length > 10 && (
                    <p className="text-white/40 text-xs mt-2">+{store.redeemed.length - 10} more redeemed</p>
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
