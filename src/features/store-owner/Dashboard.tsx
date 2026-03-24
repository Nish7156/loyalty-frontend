import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { partnersApi, branchesApi, activityApi, rewardsApi } from '../../lib/api';
import type { Partner } from '../../lib/api';
import type { Branch } from '../../lib/api';
import type { Activity } from '../../lib/api';
import type { Reward } from '../../lib/api';

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
      const val = a.value ?? 0;
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

  if (loading) return <p className="text-sm md:text-base p-2" style={{ color: '#7B5E54' }}>Loading…</p>;
  if (error) return <p className="text-sm md:text-base p-2" style={{ color: '#B03A2A' }}>{error}</p>;

  const myPartners = auth?.type === 'platform' && auth?.user?.id ? partners.filter((p) => p.ownerId === auth.user!.id) : partners;
  const myBranches = branches.filter((b) => myPartners.some((p) => p.id === b.partnerId));

  const totalCustomers = customerStats.length;
  const totalVisits = customerStats.reduce((sum, c) => sum + c.visitCount, 0);
  const totalRevenue = customerStats.reduce((sum, c) => sum + c.totalPaid, 0);
  const totalActiveRewards = customerStats.reduce((sum, c) => sum + c.activeRewards, 0);

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6" style={{ background: '#FAF9F6' }}>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#5D4037' }}>Dashboard</h1>
        <p style={{ color: '#7B5E54' }}>Welcome back! Here's your business overview</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="rounded-2xl p-4 sm:p-6" style={{ background: '#FAECE7', border: '1px solid #F5C4B3', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: '#D85A30' }}>Total Customers</p>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(216,90,48,0.1)' }}>
              <span className="material-symbols-rounded" style={{ color: '#D85A30', fontSize: '24px' }}>group</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: '#5D4037' }}>{totalCustomers}</p>
          <p className="text-sm" style={{ color: '#D85A30' }}>Unique visitors</p>
        </div>

        <div className="rounded-2xl p-4 sm:p-6" style={{ background: '#E4F2EB', border: '1px solid rgba(42,96,64,0.15)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: '#2A6040' }}>Total Visits</p>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(42,96,64,0.1)' }}>
              <span className="material-symbols-rounded" style={{ color: '#2A6040', fontSize: '24px' }}>bar_chart</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: '#5D4037' }}>{totalVisits}</p>
          <p className="text-sm" style={{ color: '#2A6040' }}>Check-ins approved</p>
        </div>

        <div className="rounded-2xl p-4 sm:p-6" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: '#7B5E54' }}>Total Revenue</p>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(216,90,48,0.08)' }}>
              <span className="material-symbols-rounded" style={{ color: '#D85A30', fontSize: '24px' }}>payments</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: '#5D4037' }}>₹{totalRevenue}</p>
          <p className="text-sm" style={{ color: '#7B5E54' }}>Lifetime earnings</p>
        </div>

        <div className="rounded-2xl p-4 sm:p-6" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: '#7B5E54' }}>Active Rewards</p>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(216,90,48,0.08)' }}>
              <span className="material-symbols-rounded" style={{ color: '#D85A30', fontSize: '24px' }}>redeem</span>
            </div>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: '#5D4037' }}>{totalActiveRewards}</p>
          <p className="text-sm" style={{ color: '#7B5E54' }}>Pending redemptions</p>
        </div>
      </div>

      {/* Business Overview */}
      <div className="grid gap-3 sm:gap-5 lg:grid-cols-2 lg:gap-6 mb-6 sm:mb-8">
        <div className="rounded-2xl p-4 sm:p-6" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#FAECE7' }}>
              <span className="material-symbols-rounded" style={{ color: '#D85A30', fontSize: '22px' }}>storefront</span>
            </div>
            <h2 className="text-lg font-semibold" style={{ color: '#5D4037' }}>My Stores</h2>
          </div>
          {myPartners.length === 0 ? (
            <p className="text-sm" style={{ color: '#A08880' }}>No stores yet</p>
          ) : (
            <ul className="space-y-3">
              {myPartners.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#FAF9F6', border: '1px solid #FAECE7' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold" style={{ background: '#D85A30' }}>
                    {p.businessName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: '#5D4037' }}>{p.businessName}</p>
                    <p className="text-xs" style={{ color: '#A08880' }}>{p.industryType}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl p-4 sm:p-6" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#E4F2EB' }}>
              <span className="material-symbols-rounded" style={{ color: '#2A6040', fontSize: '22px' }}>location_on</span>
            </div>
            <div className="flex-1 flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: '#5D4037' }}>Branches</h2>
              <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: '#E4F2EB', color: '#2A6040' }}>
                {myBranches.length}
              </span>
            </div>
          </div>
          {myBranches.length === 0 ? (
            <p className="text-sm" style={{ color: '#A08880' }}>No branches yet</p>
          ) : (
            <ul className="space-y-3">
              {myBranches.map((b) => (
                <li key={b.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#FAF9F6', border: '1px solid #FAECE7' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold" style={{ background: '#2A6040' }}>
                    {b.branchName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: '#5D4037' }}>{b.branchName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {b.loyaltyType === 'VISITS' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#FAECE7', color: '#D85A30' }}>
                          <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '12px' }}>confirmation_number</span> Visits
                        </span>
                      )}
                      {b.loyaltyType === 'POINTS' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#E4F2EB', color: '#2A6040' }}>
                          <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '12px' }}>payments</span> Points
                        </span>
                      )}
                      {b.loyaltyType === 'HYBRID' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#FAECE7', color: '#D85A30' }}>
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
      <div className="rounded-2xl overflow-hidden" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
        <div className="p-6" style={{ borderBottom: '1px solid #FAECE7' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#FAECE7' }}>
              <span className="material-symbols-rounded" style={{ color: '#D85A30', fontSize: '22px' }}>trending_up</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#5D4037' }}>Customer Activity</h2>
              <p className="text-sm" style={{ color: '#7B5E54' }}>Track engagement and revenue</p>
            </div>
          </div>
        </div>

        {customerStats.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-rounded" style={{ fontSize: '64px', color: '#A08880' }}>bar_chart</span>
            <p className="text-lg font-medium" style={{ color: '#7B5E54' }}>No customer activity yet</p>
            <p className="text-sm mt-2" style={{ color: '#A08880' }}>Customer visits will appear here once they start checking in</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: '#FAECE7' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037', borderBottom: '1px solid #F5C4B3' }}>Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037', borderBottom: '1px solid #F5C4B3' }}>Visits</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037', borderBottom: '1px solid #F5C4B3' }}>This Month</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037', borderBottom: '1px solid #F5C4B3' }}>Last Month</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037', borderBottom: '1px solid #F5C4B3' }}>Total Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037', borderBottom: '1px solid #F5C4B3' }}>Active</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037', borderBottom: '1px solid #F5C4B3' }}>Redeemed</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4037', borderBottom: '1px solid #F5C4B3' }}>Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {customerStats.map((s, idx) => (
                    <tr key={s.phone} className="transition-colors" style={{ borderBottom: idx < customerStats.length - 1 ? '1px solid #FAECE7' : 'none' }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ background: 'linear-gradient(135deg, #D85A30, #E8784E)' }}>
                            {s.phone.slice(-2)}
                          </div>
                          <span className="font-medium font-mono text-sm" style={{ color: '#5D4037' }}>{s.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: '#FAECE7', color: '#D85A30' }}>
                          {s.visitCount}
                        </span>
                      </td>
                      <td className="px-6 py-4" style={{ color: '#5D4037' }}>₹{s.monthlyPaid[thisMonth] ?? 0}</td>
                      <td className="px-6 py-4" style={{ color: '#5D4037' }}>₹{s.monthlyPaid[lastMonth] ?? 0}</td>
                      <td className="px-6 py-4 font-semibold" style={{ color: '#5D4037' }}>₹{s.totalPaid}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: '#E4F2EB', color: '#2A6040' }}>
                          {s.activeRewards}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: '#FAF9F6', color: '#7B5E54', border: '1px solid #FAECE7' }}>
                          {s.redeemedRewards}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#7B5E54' }}>
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
                <div key={s.phone} className="p-4 transition-colors" style={{ borderBottom: idx < customerStats.length - 1 ? '1px solid #FAECE7' : 'none' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shrink-0" style={{ background: 'linear-gradient(135deg, #D85A30, #E8784E)' }}>
                      {s.phone.slice(-2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold font-mono text-sm" style={{ color: '#5D4037' }}>{s.phone}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#A08880' }}>
                        Last visit: {s.lastVisitAt ? new Date(s.lastVisitAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl p-3" style={{ background: '#FAECE7', border: '1px solid #F5C4B3' }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: '#D85A30' }}>Visits</p>
                      <p className="text-lg font-bold" style={{ color: '#5D4037' }}>{s.visitCount}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: '#E4F2EB', border: '1px solid rgba(42,96,64,0.15)' }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: '#2A6040' }}>Total Paid</p>
                      <p className="text-lg font-bold" style={{ color: '#5D4037' }}>₹{s.totalPaid}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: '#FFF', border: '1px solid #FAECE7' }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: '#7B5E54' }}>This Month</p>
                      <p className="text-lg font-bold" style={{ color: '#5D4037' }}>₹{s.monthlyPaid[thisMonth] ?? 0}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: '#FFF', border: '1px solid #FAECE7' }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: '#7B5E54' }}>Active Rewards</p>
                      <p className="text-lg font-bold" style={{ color: '#5D4037' }}>{s.activeRewards}</p>
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
