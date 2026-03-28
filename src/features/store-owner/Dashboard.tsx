import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { partnersApi, branchesApi, activityApi, rewardsApi } from '../../lib/api';
import type { Partner } from '../../lib/api';
import type { Branch } from '../../lib/api';
import type { Activity } from '../../lib/api';
import type { Reward } from '../../lib/api';

/** Format currency: compact for large values (1.2K, 3.5L, 1.2Cr), full for small */
function formatCurrencyCompact(n: number): string {
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(1).replace(/\.0$/, '')}L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toLocaleString('en-IN');
}

/** Full formatted currency for tooltips */
function formatCurrencyFull(n: number): string {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

type CustomerStoreStats = {
  phone: string;
  visitCount: number;
  monthlyPaid: Record<string, number>;
  totalPaid: number;
  activeRewards: number;
  redeemedRewards: number;
  lastVisitAt: string | null;
};

function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function OwnerDashboard() {
  const { auth } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([partnersApi.list(), branchesApi.list(), activityApi.list(), rewardsApi.list()])
      .then(([p, b, a, r]) => {
        setPartners(p);
        setBranches(b);
        setActivities(a);
        setRewards(r);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const customerStats = useMemo((): CustomerStoreStats[] => {
    const myPartners = auth?.type === 'platform' && auth?.user?.id
      ? partners.filter((p) => p.ownerId === auth.user!.id)
      : partners;
    const myBranches = branches.filter((b) => myPartners.some((p) => p.id === b.partnerId));
    const myBranchIds = new Set(myBranches.map((b) => b.id));
    const myPartnerIds = new Set(myPartners.map((p) => p.id));
    const myActivities = activities.filter(
      (a) => myBranchIds.has(a.branchId) && a.status === 'APPROVED'
    );
    const myRewardsList = rewards.filter((r) => myPartnerIds.has(r.partnerId));
    const byPhone = new Map<string, CustomerStoreStats>();

    for (const a of myActivities) {
      const phone = a.customerId;
      if (!byPhone.has(phone)) {
        byPhone.set(phone, {
          phone,
          visitCount: 0,
          monthlyPaid: {},
          totalPaid: 0,
          activeRewards: 0,
          redeemedRewards: 0,
          lastVisitAt: null,
        });
      }
      const s = byPhone.get(phone)!;
      s.visitCount += 1;
      const val = Number(a.value) || 0;
      s.totalPaid += val;
      const monthKey = toMonthKey(new Date(a.createdAt));
      s.monthlyPaid[monthKey] = (s.monthlyPaid[monthKey] ?? 0) + val;
      if (!s.lastVisitAt || a.createdAt > s.lastVisitAt) s.lastVisitAt = a.createdAt;
    }

    for (const r of myRewardsList) {
      const phone = r.customerId;
      if (!byPhone.has(phone)) {
        byPhone.set(phone, {
          phone,
          visitCount: 0,
          monthlyPaid: {},
          totalPaid: 0,
          activeRewards: 0,
          redeemedRewards: 0,
          lastVisitAt: null,
        });
      }
      const s = byPhone.get(phone)!;
      if (r.status === 'ACTIVE') s.activeRewards += 1;
      else s.redeemedRewards += 1;
    }

    return Array.from(byPhone.values()).sort((a, b) => (b.lastVisitAt ?? '').localeCompare(a.lastVisitAt ?? ''));
  }, [activities, rewards, branches, partners, auth?.type, auth?.type === 'platform' ? auth?.user?.id : null]);

  const thisMonth = toMonthKey(new Date());
  const lastMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return toMonthKey(d);
  })();

  if (loading) return <p className="text-sm md:text-base p-2" style={{ color: 'var(--t2)' }}>Loading…</p>;
  if (error) return <p className="text-sm md:text-base p-2" style={{ color: 'var(--re)' }}>{error}</p>;

  const myPartners = auth?.type === 'platform' && auth?.user?.id ? partners.filter((p) => p.ownerId === auth.user!.id) : partners;
  const myBranches = branches.filter((b) => myPartners.some((p) => p.id === b.partnerId));

  const totalCustomers = customerStats.length;
  const totalVisits = customerStats.reduce((sum, c) => sum + c.visitCount, 0);
  const totalRevenue = customerStats.reduce((sum, c) => sum + c.totalPaid, 0);
  const totalActiveRewards = customerStats.reduce((sum, c) => sum + c.activeRewards, 0);

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6" style={{ background: 'var(--bg)' }}>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--t)' }}>Dashboard</h1>
        <p style={{ color: 'var(--t2)' }}>Welcome back! Here's your business overview</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="rounded-2xl p-4 sm:p-6" style={{ background: 'var(--bdl)', border: '1px solid var(--bd)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: 'var(--a)' }}>Total Customers</p>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(216,90,48,0.1)' }}>
              <span className="material-symbols-rounded" style={{ color: 'var(--a)', fontSize: '24px' }}>group</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: 'var(--t)' }}>{totalCustomers}</p>
          <p className="text-sm" style={{ color: 'var(--a)' }}>Unique visitors</p>
        </div>

        <div className="rounded-2xl p-4 sm:p-6" style={{ background: 'var(--grbg)', border: '1px solid rgba(42,96,64,0.15)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: 'var(--gr)' }}>Total Visits</p>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(42,96,64,0.1)' }}>
              <span className="material-symbols-rounded" style={{ color: 'var(--gr)', fontSize: '24px' }}>bar_chart</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: 'var(--t)' }}>{totalVisits}</p>
          <p className="text-sm" style={{ color: 'var(--gr)' }}>Check-ins approved</p>
        </div>

        <div className="rounded-2xl p-4 sm:p-6" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: 'var(--t2)' }}>Total Revenue</p>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(216,90,48,0.08)' }}>
              <span className="material-symbols-rounded" style={{ color: 'var(--a)', fontSize: '24px' }}>payments</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-1 truncate" style={{ color: 'var(--t)' }} title={formatCurrencyFull(totalRevenue)}>₹{formatCurrencyCompact(totalRevenue)}</p>
          <p className="text-sm" style={{ color: 'var(--t2)' }}>Lifetime earnings</p>
        </div>

        <div className="rounded-2xl p-4 sm:p-6" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: 'var(--t2)' }}>Active Rewards</p>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(216,90,48,0.08)' }}>
              <span className="material-symbols-rounded" style={{ color: 'var(--a)', fontSize: '24px' }}>redeem</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: 'var(--t)' }}>{totalActiveRewards}</p>
          <p className="text-sm" style={{ color: 'var(--t2)' }}>Pending redemptions</p>
        </div>
      </div>

      {/* Business Overview */}
      <div className="grid gap-3 sm:gap-5 lg:grid-cols-2 lg:gap-6 mb-6 sm:mb-8">
        <div className="rounded-2xl p-4 sm:p-6" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--bdl)' }}>
              <span className="material-symbols-rounded" style={{ color: 'var(--a)', fontSize: '22px' }}>storefront</span>
            </div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--t)' }}>My Stores</h2>
          </div>
          {myPartners.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--t3)' }}>No stores yet</p>
          ) : (
            <ul className="space-y-3">
              {myPartners.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--bdl)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold" style={{ background: 'var(--a)' }}>
                    {p.businessName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--t)' }}>{p.businessName}</p>
                    <p className="text-xs" style={{ color: 'var(--t3)' }}>{p.industryType}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl p-4 sm:p-6" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--grbg)' }}>
              <span className="material-symbols-rounded" style={{ color: 'var(--gr)', fontSize: '22px' }}>location_on</span>
            </div>
            <div className="flex-1 flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--t)' }}>Branches</h2>
              <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: 'var(--grbg)', color: 'var(--gr)' }}>
                {myBranches.length}
              </span>
            </div>
          </div>
          {myBranches.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--t3)' }}>No branches yet</p>
          ) : (
            <ul className="space-y-3">
              {myBranches.map((b) => (
                <li key={b.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--bdl)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold" style={{ background: 'var(--gr)' }}>
                    {b.branchName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--t)' }}>{b.branchName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {b.loyaltyType === 'VISITS' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--bdl)', color: 'var(--a)' }}>
                          <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '12px' }}>confirmation_number</span> Visits
                        </span>
                      )}
                      {b.loyaltyType === 'POINTS' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--grbg)', color: 'var(--gr)' }}>
                          <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '12px' }}>payments</span> Points
                        </span>
                      )}
                      {b.loyaltyType === 'HYBRID' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--bdl)', color: 'var(--a)' }}>
                          <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '12px' }}>sync</span> Hybrid
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Customer Activity Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--bdl)' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--bdl)' }}>
              <span className="material-symbols-rounded" style={{ color: 'var(--a)', fontSize: '22px' }}>trending_up</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--t)' }}>Customer Activity</h2>
              <p className="text-sm" style={{ color: 'var(--t2)' }}>Track engagement and revenue</p>
            </div>
          </div>
        </div>

        {customerStats.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-rounded" style={{ fontSize: '64px', color: 'var(--t3)' }}>bar_chart</span>
            <p className="text-lg font-medium" style={{ color: 'var(--t2)' }}>No customer activity yet</p>
            <p className="text-sm mt-2" style={{ color: 'var(--t3)' }}>Customer visits will appear here once they start checking in</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: 'var(--bdl)' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t)', borderBottom: '1px solid var(--bd)' }}>Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t)', borderBottom: '1px solid var(--bd)' }}>Visits</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t)', borderBottom: '1px solid var(--bd)' }}>This Month</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t)', borderBottom: '1px solid var(--bd)' }}>Last Month</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t)', borderBottom: '1px solid var(--bd)' }}>Total Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t)', borderBottom: '1px solid var(--bd)' }}>Active</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t)', borderBottom: '1px solid var(--bd)' }}>Redeemed</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t)', borderBottom: '1px solid var(--bd)' }}>Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {customerStats.map((s, idx) => (
                    <tr key={s.phone} className="transition-colors" style={{ borderBottom: idx < customerStats.length - 1 ? '1px solid var(--bdl)' : 'none' }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ background: 'linear-gradient(135deg, var(--a), #E8784E)' }}>
                            {s.phone.slice(-2)}
                          </div>
                          <span className="font-medium font-mono text-sm" style={{ color: 'var(--t)' }}>{s.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--bdl)', color: 'var(--a)' }}>
                          {s.visitCount}
                        </span>
                      </td>
                      <td className="px-6 py-4" style={{ color: 'var(--t)' }} title={formatCurrencyFull(s.monthlyPaid[thisMonth] ?? 0)}>₹{formatCurrencyCompact(s.monthlyPaid[thisMonth] ?? 0)}</td>
                      <td className="px-6 py-4" style={{ color: 'var(--t)' }} title={formatCurrencyFull(s.monthlyPaid[lastMonth] ?? 0)}>₹{formatCurrencyCompact(s.monthlyPaid[lastMonth] ?? 0)}</td>
                      <td className="px-6 py-4 font-semibold" style={{ color: 'var(--t)' }} title={formatCurrencyFull(s.totalPaid)}>₹{formatCurrencyCompact(s.totalPaid)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--grbg)', color: 'var(--gr)' }}>
                          {s.activeRewards}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--bg)', color: 'var(--t2)', border: '1px solid var(--bdl)' }}>
                          {s.redeemedRewards}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--t2)' }}>
                        {s.lastVisitAt ? new Date(s.lastVisitAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              {customerStats.map((s, idx) => (
                <div key={s.phone} className="p-4 transition-colors" style={{ borderBottom: idx < customerStats.length - 1 ? '1px solid var(--bdl)' : 'none' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shrink-0" style={{ background: 'linear-gradient(135deg, var(--a), #E8784E)' }}>
                      {s.phone.slice(-2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold font-mono text-sm" style={{ color: 'var(--t)' }}>{s.phone}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>
                        Last visit: {s.lastVisitAt ? new Date(s.lastVisitAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl p-3" style={{ background: 'var(--bdl)', border: '1px solid var(--bd)' }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--a)' }}>Visits</p>
                      <p className="text-lg font-bold" style={{ color: 'var(--t)' }}>{s.visitCount}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: 'var(--grbg)', border: '1px solid rgba(42,96,64,0.15)' }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--gr)' }}>Total Paid</p>
                      <p className="text-lg font-bold truncate" style={{ color: 'var(--t)' }} title={formatCurrencyFull(s.totalPaid)}>₹{formatCurrencyCompact(s.totalPaid)}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: 'var(--s)', border: '1px solid var(--bdl)' }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--t2)' }}>This Month</p>
                      <p className="text-lg font-bold truncate" style={{ color: 'var(--t)' }} title={formatCurrencyFull(s.monthlyPaid[thisMonth] ?? 0)}>₹{formatCurrencyCompact(s.monthlyPaid[thisMonth] ?? 0)}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: 'var(--s)', border: '1px solid var(--bdl)' }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--t2)' }}>Active Rewards</p>
                      <p className="text-lg font-bold" style={{ color: 'var(--t)' }}>{s.activeRewards}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
