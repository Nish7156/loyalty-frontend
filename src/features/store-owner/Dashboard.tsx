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

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  const myPartners = auth.type === 'platform' ? partners.filter((p) => p.ownerId === auth.user.id) : partners;
  const myBranches = branches.filter((b) => myPartners.some((p) => p.id === b.partnerId));
  const myBranchIds = new Set(myBranches.map((b) => b.id));
  const myPartnerIds = new Set(myPartners.map((p) => p.id));

  const customerStats = useMemo((): CustomerStoreStats[] => {
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
  }, [activities, rewards, branches, partners, auth.type, auth.type === 'platform' ? auth.user?.id : null]);

  const thisMonth = toMonthKey(new Date());
  const lastMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return toMonthKey(d);
  })();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Owner Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 mb-6">
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
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-3">Customers at my store(s)</h2>
        {customerStats.length === 0 ? (
          <p className="text-gray-500">No customer activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
        )}
      </div>
    </div>
  );
}
