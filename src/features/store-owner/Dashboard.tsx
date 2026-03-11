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

  if (loading) return <p className="text-sm md:text-base p-2">Loading…</p>;
  if (error) return <p className="text-red-600 text-sm md:text-base p-2">{error}</p>;

  const myPartners = auth?.type === 'platform' && auth?.user?.id ? partners.filter((p) => p.ownerId === auth.user!.id) : partners;
  const myBranches = branches.filter((b) => myPartners.some((p) => p.id === b.partnerId));

  const totalCustomers = customerStats.length;
  const totalVisits = customerStats.reduce((sum, c) => sum + c.visitCount, 0);
  const totalRevenue = customerStats.reduce((sum, c) => sum + c.totalPaid, 0);
  const totalActiveRewards = customerStats.reduce((sum, c) => sum + c.activeRewards, 0);

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your business overview</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/50 rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-indigo-700 text-sm font-medium">Total Customers</p>
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalCustomers}</p>
          <p className="text-indigo-600 text-sm">Unique visitors</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-emerald-700 text-sm font-medium">Total Visits</p>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalVisits}</p>
          <p className="text-emerald-600 text-sm">Check-ins approved</p>
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-200/50 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-violet-700 text-sm font-medium">Total Revenue</p>
            <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">₹{totalRevenue}</p>
          <p className="text-violet-600 text-sm">Lifetime earnings</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-amber-700 text-sm font-medium">Active Rewards</p>
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎁</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalActiveRewards}</p>
          <p className="text-amber-600 text-sm">Pending redemptions</p>
        </div>
      </div>

      {/* Business Overview */}
      <div className="grid gap-3 sm:gap-5 lg:grid-cols-2 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">🏪</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">My Stores</h2>
          </div>
          {myPartners.length === 0 ? (
            <p className="text-gray-500 text-sm">No stores yet</p>
          ) : (
            <ul className="space-y-3">
              {myPartners.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-semibold">
                    {p.businessName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.businessName}</p>
                    <p className="text-xs text-gray-500">{p.industryType}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">📍</span>
            </div>
            <div className="flex-1 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Branches</h2>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                {myBranches.length}
              </span>
            </div>
          </div>
          {myBranches.length === 0 ? (
            <p className="text-gray-500 text-sm">No branches yet</p>
          ) : (
            <ul className="space-y-3">
              {myBranches.map((b) => (
                <li key={b.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-emerald-50/30 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-semibold">
                    {b.branchName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{b.branchName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {b.loyaltyType === 'VISITS' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          🎫 Visits
                        </span>
                      )}
                      {b.loyaltyType === 'POINTS' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          💰 Points
                        </span>
                      )}
                      {b.loyaltyType === 'HYBRID' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          🔄 Hybrid
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
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">📈</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Customer Activity</h2>
              <p className="text-sm text-gray-600">Track engagement and revenue</p>
            </div>
          </div>
        </div>

        {customerStats.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-500 text-lg font-medium">No customer activity yet</p>
            <p className="text-gray-400 text-sm mt-2">Customer visits will appear here once they start checking in</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Visits</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">This Month</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Last Month</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Active</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Redeemed</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Last Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerStats.map((s) => (
                    <tr key={s.phone} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {s.phone.slice(-2)}
                          </div>
                          <span className="font-medium text-gray-900 font-mono text-sm">{s.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          {s.visitCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">₹{s.monthlyPaid[thisMonth] ?? 0}</td>
                      <td className="px-6 py-4 text-gray-700">₹{s.monthlyPaid[lastMonth] ?? 0}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">₹{s.totalPaid}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          {s.activeRewards}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {s.redeemedRewards}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {s.lastVisitAt ? new Date(s.lastVisitAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {customerStats.map((s) => (
                <div key={s.phone} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {s.phone.slice(-2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 font-mono text-sm">{s.phone}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Last visit: {s.lastVisitAt ? new Date(s.lastVisitAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                      <p className="text-xs text-indigo-600 font-medium mb-0.5">Visits</p>
                      <p className="text-lg font-bold text-indigo-900">{s.visitCount}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                      <p className="text-xs text-emerald-600 font-medium mb-0.5">Total Paid</p>
                      <p className="text-lg font-bold text-emerald-900">₹{s.totalPaid}</p>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
                      <p className="text-xs text-violet-600 font-medium mb-0.5">This Month</p>
                      <p className="text-lg font-bold text-violet-900">₹{s.monthlyPaid[thisMonth] ?? 0}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                      <p className="text-xs text-amber-600 font-medium mb-0.5">Active Rewards</p>
                      <p className="text-lg font-bold text-amber-900">{s.activeRewards}</p>
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
