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

  return (
    <div className="min-w-0">
      <h1 className="text-lg font-bold mb-3 md:text-2xl md:mb-4">Owner Dashboard</h1>
      <div className="grid gap-3 md:grid-cols-2 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white rounded-lg shadow p-3 md:p-4 min-w-0">
          <h2 className="font-semibold mb-2 text-sm md:text-base">My Store</h2>
          <ul className="divide-y divide-gray-100">
            {myPartners.map((p) => (
              <li key={p.id} className="py-2 text-sm md:text-base truncate">{p.businessName} — {p.industryType}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow p-3 md:p-4 min-w-0">
          <h2 className="font-semibold mb-2 text-sm md:text-base">Branches ({myBranches.length})</h2>
          <ul className="divide-y divide-gray-100">
            {myBranches.map((b) => (
              <li key={b.id} className="py-2 text-sm md:text-base truncate">{b.branchName}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-3 md:p-4 min-w-0">
        <h2 className="font-semibold mb-3 text-sm md:text-base">Customers at my store(s)</h2>
        {customerStats.length === 0 ? (
          <p className="text-gray-500 text-sm">No customer activity yet.</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">User (phone)</th>
                    <th className="py-2 pr-4">Visits</th>
                    <th className="py-2 pr-4">This month paid</th>
                    <th className="py-2 pr-4">Last month paid</th>
                    <th className="py-2 pr-4">Total paid</th>
                    <th className="py-2 pr-4">Active rewards</th>
                    <th className="py-2 pr-4">Redeemed</th>
                    <th className="py-2">Last visit</th>
                  </tr>
                </thead>
                <tbody>
                  {customerStats.map((s) => (
                    <tr key={s.phone} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium">{s.phone}</td>
                      <td className="py-2 pr-4">{s.visitCount}</td>
                      <td className="py-2 pr-4">{s.monthlyPaid[thisMonth] ?? 0}</td>
                      <td className="py-2 pr-4">{s.monthlyPaid[lastMonth] ?? 0}</td>
                      <td className="py-2 pr-4">{s.totalPaid}</td>
                      <td className="py-2 pr-4">{s.activeRewards}</td>
                      <td className="py-2 pr-4">{s.redeemedRewards}</td>
                      <td className="py-2">{s.lastVisitAt ? new Date(s.lastVisitAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="md:hidden space-y-3">
              {customerStats.map((s) => (
                <li key={s.phone} className="border border-gray-200 rounded-lg p-3 text-sm">
                  <p className="font-medium truncate">{s.phone}</p>
                  <p className="text-gray-600 mt-1">Visits: {s.visitCount} · This month: {s.monthlyPaid[thisMonth] ?? 0} · Last month: {s.monthlyPaid[lastMonth] ?? 0}</p>
                  <p className="text-gray-600">Total: {s.totalPaid} · Active: {s.activeRewards} · Redeemed: {s.redeemedRewards}</p>
                  <p className="text-gray-500 text-xs mt-1">Last visit: {s.lastVisitAt ? new Date(s.lastVisitAt).toLocaleDateString() : '—'}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
