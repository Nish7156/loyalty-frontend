import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { partnersApi, branchesApi } from '../../lib/api';
import type { Partner } from '../../lib/api';
import type { Branch } from '../../lib/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { QRCodeSVG } from 'qrcode.react';

type BranchWithDetails = Branch & { partner?: Partner; staff?: { id: string }[] };

export function BranchesPage() {
  const { auth } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [branches, setBranches] = useState<BranchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [loyaltyType, setLoyaltyType] = useState<'VISITS' | 'POINTS' | 'HYBRID'>('VISITS');
  const [cooldownHours, setCooldownHours] = useState(0);
  const [cooldownMinutes, setCooldownMinutes] = useState(0);
  const [streakThreshold, setStreakThreshold] = useState<number>(5);
  const [rewardWindowDays, setRewardWindowDays] = useState<number>(30);
  const [rewardDescription, setRewardDescription] = useState('');
  const [minCheckInAmount, setMinCheckInAmount] = useState<string>('');
  const [pointsPercentage, setPointsPercentage] = useState<number>(5);
  const [pointsExpiryDays, setPointsExpiryDays] = useState<number>(365);
  const [pointsToRewardRatio, setPointsToRewardRatio] = useState<number>(100);
  const [minimumRedemptionPoints, setMinimumRedemptionPoints] = useState<number>(50);
  const [submitting, setSubmitting] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editLoyaltyType, setEditLoyaltyType] = useState<'VISITS' | 'POINTS' | 'HYBRID'>('VISITS');
  const [editCooldownHours, setEditCooldownHours] = useState<number>(0);
  const [editCooldownMinutes, setEditCooldownMinutes] = useState<number>(0);
  const [editStreakThreshold, setEditStreakThreshold] = useState<number>(5);
  const [editRewardWindowDays, setEditRewardWindowDays] = useState<number>(30);
  const [editRewardDescription, setEditRewardDescription] = useState('');
  const [editMinCheckInAmount, setEditMinCheckInAmount] = useState<string>('');
  const [editPointsPercentage, setEditPointsPercentage] = useState<number>(5);
  const [editPointsExpiryDays, setEditPointsExpiryDays] = useState<number>(365);
  const [editPointsToRewardRatio, setEditPointsToRewardRatio] = useState<number>(100);
  const [editMinimumRedemptionPoints, setEditMinimumRedemptionPoints] = useState<number>(50);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const myPartners =
    auth.type === 'platform'
      ? partners.filter((p) => p.ownerId === auth.user.id)
      : partners;

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([partnersApi.list(), branchesApi.list()])
      .then(([p, b]) => {
        setPartners(Array.isArray(p) ? p : []);
        const list = Array.isArray(b) ? b : [];
        setBranches(list as BranchWithDetails[]);
        if (auth.type === 'platform') {
          const mine = (Array.isArray(p) ? p : []).filter((x) => x.ownerId === auth.user.id);
          if (mine.length)
            setPartnerId((prev) => (mine.some((m) => m.id === prev) ? prev : mine[0].id));
        } else if (Array.isArray(p) && p.length) {
          setPartnerId((prev) => (p.some((x) => x.id === prev) ? prev : p[0].id));
        }
        if (list.length === 0) {
          setLoading(false);
          return;
        }
        Promise.all(list.map((br) => branchesApi.get(br.id)))
          .then((details) => setBranches(details as BranchWithDetails[]))
          .catch(() => { })
          .finally(() => setLoading(false));
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => load(), []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const minAmount = minCheckInAmount.trim() ? Number(minCheckInAmount) : undefined;
      await branchesApi.create({
        branchName,
        partnerId,
        loyaltyType,
        settings: {
          cooldownMinutes: cooldownHours * 60 + cooldownMinutes,
          streakThreshold,
          rewardWindowDays,
          rewardDescription: rewardDescription || undefined,
          ...(minAmount != null && !Number.isNaN(minAmount) && minAmount >= 0 ? { minCheckInAmount: minAmount } : {}),
          walletEnabled: loyaltyType === 'POINTS' || loyaltyType === 'HYBRID',
          pointsPercentage,
          pointsExpiryDays,
          pointsToRewardRatio,
          minimumRedemptionPoints,
        },
      });
      setBranchName('');
      setLoyaltyType('VISITS');
      setCooldownHours(0);
      setCooldownMinutes(0);
      setStreakThreshold(5);
      setRewardWindowDays(30);
      setRewardDescription('');
      setMinCheckInAmount('');
      setPointsPercentage(5);
      setPointsExpiryDays(365);
      setPointsToRewardRatio(100);
      setMinimumRedemptionPoints(50);
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-sm md:text-base p-2">Loading…</p>;

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Branches</h1>
        <p className="text-gray-600">Manage your branch locations and loyalty settings</p>
      </div>

      {!showForm && (
        <div className="mb-6">
          <Button onClick={() => setShowForm(true)} className="min-h-[44px] bg-indigo-600 hover:bg-indigo-500">
            <span className="text-lg mr-2">+</span> Add Branch
          </Button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New Branch</h2>
          <form onSubmit={handleCreate} className="max-w-2xl">
            {myPartners.length === 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                Create a store (partner) first from the admin or dashboard.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Store</label>
                <select
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {myPartners.map((p) => (
                    <option key={p.id} value={p.id}>{p.businessName}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Branch Name"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                required
              />
            </div>

            <div className="mt-6 p-5 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
              <label className="block text-base font-bold text-gray-900 mb-2.5">🎯 Loyalty System Type</label>
              <p className="text-sm text-gray-600 mb-4">Choose ONE loyalty mechanism for this branch</p>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md"
                  style={{
                    borderColor: loyaltyType === 'VISITS' ? '#3b82f6' : '#e5e7eb',
                    backgroundColor: loyaltyType === 'VISITS' ? '#eff6ff' : 'white',
                    boxShadow: loyaltyType === 'VISITS' ? '0 4px 6px -1px rgb(59 130 246 / 0.1)' : 'none'
                  }}>
                  <input
                    type="radio"
                    name="loyaltyType"
                    value="VISITS"
                    checked={loyaltyType === 'VISITS'}
                    onChange={(e) => setLoyaltyType(e.target.value as 'VISITS')}
                    className="mt-1 w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-base text-gray-900">🎫 Visit-Based (Stamp Card)</div>
                    <div className="text-sm text-gray-600 mt-1">Customers earn rewards after X visits</div>
                    <div className="text-xs text-blue-600 mt-1.5 font-medium">✓ Best for: Coffee shops, salons, small retail</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md"
                  style={{
                    borderColor: loyaltyType === 'POINTS' ? '#3b82f6' : '#e5e7eb',
                    backgroundColor: loyaltyType === 'POINTS' ? '#eff6ff' : 'white',
                    boxShadow: loyaltyType === 'POINTS' ? '0 4px 6px -1px rgb(59 130 246 / 0.1)' : 'none'
                  }}>
                  <input
                    type="radio"
                    name="loyaltyType"
                    value="POINTS"
                    checked={loyaltyType === 'POINTS'}
                    onChange={(e) => setLoyaltyType(e.target.value as 'POINTS')}
                    className="mt-1 w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-base text-gray-900">💰 Points-Based (Wallet)</div>
                    <div className="text-sm text-gray-600 mt-1">Customers earn points based on spending</div>
                    <div className="text-xs text-blue-600 mt-1.5 font-medium">✓ Best for: Restaurants, retail, variable spending</div>
                  </div>
                </label>
              </div>
            </div>

            {loyaltyType === 'VISITS' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Cooldown (hours and/or minutes)</label>
                    <p className="text-xs text-gray-500 mb-2">Next check-in allowed after this from last approved visit</p>
                    <div className="flex gap-3 items-center">
                      <input
                        type="number"
                        min={0}
                        max={48}
                        value={cooldownHours}
                        onChange={(e) => setCooldownHours(Math.max(0, Math.min(48, Number(e.target.value) ?? 0)))}
                        className="w-20 border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <span className="text-sm font-medium">hrs</span>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={cooldownMinutes}
                        onChange={(e) => setCooldownMinutes(Math.max(0, Math.min(59, Number(e.target.value) ?? 0)))}
                        className="w-20 border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <span className="text-sm font-medium">min</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Visits needed for reward</label>
                    <input
                      type="number"
                      min={1}
                      value={streakThreshold}
                      onChange={(e) => setStreakThreshold(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Reward window (days)</label>
                    <input
                      type="number"
                      min={1}
                      value={rewardWindowDays}
                      onChange={(e) => setRewardWindowDays(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Reward description</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 free coffee"
                      value={rewardDescription}
                      onChange={(e) => setRewardDescription(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {loyaltyType === 'POINTS' && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Points percentage</label>
                    <p className="text-xs text-gray-500 mb-2">% of transaction value earned as points</p>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={pointsPercentage}
                      onChange={(e) => setPointsPercentage(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Points expiry (days)</label>
                    <p className="text-xs text-gray-500 mb-2">0 = never expire</p>
                    <input
                      type="number"
                      min={0}
                      value={pointsExpiryDays}
                      onChange={(e) => setPointsExpiryDays(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Points to reward ratio</label>
                    <input
                      type="number"
                      min={1}
                      value={pointsToRewardRatio}
                      onChange={(e) => setPointsToRewardRatio(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum redemption points</label>
                    <input
                      type="number"
                      min={0}
                      value={minimumRedemptionPoints}
                      onChange={(e) => setMinimumRedemptionPoints(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Min check-in amount (optional)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="No minimum"
                      value={minCheckInAmount}
                      onChange={(e) => setMinCheckInAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button type="submit" disabled={submitting} className="min-h-[44px]">
                {submitting ? 'Creating...' : 'Create Branch'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="min-h-[44px]">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {branches.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-500 text-lg">No branches yet. Create your first branch to get started!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {branches.map((b) => {
            const settings = b.settings as {
              streakThreshold?: number;
              cooldownHours?: number;
              cooldownMinutes?: number;
              rewardWindowDays?: number;
              rewardDescription?: string;
              minCheckInAmount?: number;
              walletEnabled?: boolean;
              pointsPercentage?: number;
              pointsExpiryDays?: number;
              pointsToRewardRatio?: number;
              minimumRedemptionPoints?: number;
            } | undefined;
            const staffCount = Array.isArray(b.staff) ? b.staff.length : 0;
            const scanUrl = typeof window !== 'undefined' ? `${window.location.origin}/scan/${b.id}` : '';
            const currentCooldownTotalMinutes = settings?.cooldownMinutes ?? (settings?.cooldownHours ?? 0) * 60;
            const currentCooldownHours = Math.floor(currentCooldownTotalMinutes / 60);
            const currentCooldownMinutes = currentCooldownTotalMinutes % 60;
            const cooldownLabel = currentCooldownTotalMinutes === 0
              ? 'No cooldown'
              : currentCooldownMinutes === 0
                ? `${currentCooldownHours} h`
                : currentCooldownHours === 0
                  ? `${currentCooldownMinutes} min`
                  : `${currentCooldownHours} h ${currentCooldownMinutes} min`;
            const currentThreshold = settings?.streakThreshold ?? 5;
            const currentWindowDays = settings?.rewardWindowDays ?? 30;
            const currentRewardDesc = settings?.rewardDescription ?? '';
            const currentMinAmount = settings?.minCheckInAmount;
            const currentPointsPercentage = settings?.pointsPercentage ?? 5;
            const currentPointsExpiryDays = settings?.pointsExpiryDays ?? 365;
            const currentPointsToRewardRatio = settings?.pointsToRewardRatio ?? 100;
            const currentMinimumRedemptionPoints = settings?.minimumRedemptionPoints ?? 50;
            const currentLoyaltyType = b.loyaltyType ?? 'VISITS';
            const isEditing = editingBranchId === b.id;

            return (
              <div key={b.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-3">
                        <h2 className="text-2xl font-bold text-gray-900">{b.branchName}</h2>

                        {currentLoyaltyType === 'VISITS' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                            🎫 Visit-Based
                          </span>
                        )}
                        {currentLoyaltyType === 'POINTS' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            💰 Points-Based
                          </span>
                        )}
                        {currentLoyaltyType === 'HYBRID' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
                            🔄 Hybrid
                          </span>
                        )}
                        {b.settingsLocked && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                            🔒 Locked
                          </span>
                        )}
                      </div>

                      <div className="grid gap-3 text-sm mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium text-gray-900">Store:</span>
                          <span>{b.partner?.businessName ?? b.partnerId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium text-gray-900">Staff:</span>
                          <span>{staffCount} {staffCount === 1 ? 'member' : 'members'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium text-gray-900">ID:</span>
                          <span className="font-mono text-xs">{b.id}</span>
                        </div>
                      </div>

                      {auth.type === 'platform' && auth.user.role === 'SUPER_ADMIN' && (
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={b.settingsLocked ?? false}
                            onChange={async (e) => {
                              try {
                                await branchesApi.update(b.id, { settingsLocked: e.target.checked });
                                load();
                              } catch (err) {
                                alert('Failed to update lock status');
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            🔐 Lock settings (prevents store owner from editing)
                          </span>
                        </label>
                      )}

                      {b.settingsLocked && !(auth.type === 'platform' && auth.user.role === 'SUPER_ADMIN') && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800 font-medium">
                            🔒 Settings are locked by admin. Contact admin to make changes.
                          </p>
                        </div>
                      )}

                      <div className="mt-6 p-5 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Loyalty Settings</h3>

                        {(currentLoyaltyType === 'VISITS' || currentLoyaltyType === 'HYBRID' || (isEditing && (editLoyaltyType === 'VISITS' || editLoyaltyType === 'HYBRID'))) && (
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">Cooldown</p>
                                {!isEditing && <p className="text-sm text-gray-600 mt-1">{cooldownLabel}</p>}
                              </div>
                              {!isEditing && (!b.settingsLocked || (auth.type === 'platform' && auth.user.role === 'SUPER_ADMIN')) && (
                                <Button
                                  variant="secondary"
                                  className="text-sm px-4 py-1.5"
                                  onClick={() => {
                                    setEditingBranchId(b.id);
                                    setEditLoyaltyType(currentLoyaltyType);
                                    setEditCooldownHours(currentCooldownHours);
                                    setEditCooldownMinutes(currentCooldownMinutes);
                                    setEditStreakThreshold(currentThreshold);
                                    setEditRewardWindowDays(currentWindowDays);
                                    setEditRewardDescription(currentRewardDesc);
                                    setEditMinCheckInAmount(currentMinAmount != null ? String(currentMinAmount) : '');
                                    setEditPointsPercentage(currentPointsPercentage);
                                    setEditPointsExpiryDays(currentPointsExpiryDays);
                                    setEditPointsToRewardRatio(currentPointsToRewardRatio);
                                    setEditMinimumRedemptionPoints(currentMinimumRedemptionPoints);
                                  }}
                                >
                                  Edit
                                </Button>
                              )}
                            </div>

                            {isEditing && (
                              <div className="flex gap-3 items-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={48}
                                  value={editCooldownHours}
                                  onChange={(e) => setEditCooldownHours(Math.max(0, Math.min(48, Number(e.target.value) ?? 0)))}
                                  className="w-20 border border-gray-300 rounded-lg px-3 py-2"
                                />
                                <span className="text-sm">hrs</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={59}
                                  value={editCooldownMinutes}
                                  onChange={(e) => setEditCooldownMinutes(Math.max(0, Math.min(59, Number(e.target.value) ?? 0)))}
                                  className="w-20 border border-gray-300 rounded-lg px-3 py-2"
                                />
                                <span className="text-sm">min</span>
                              </div>
                            )}

                            <div className="pt-4 border-t border-gray-200">
                              <p className="text-sm font-medium text-gray-700">Reward Rule</p>
                              {!isEditing && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {currentThreshold} purchases in {currentWindowDays} days → {currentRewardDesc || 'Free reward'}
                                </p>
                              )}
                              {isEditing && (
                                <div className="mt-2 space-y-3">
                                  <div className="flex gap-2 items-center">
                                    <input
                                      type="number"
                                      min={1}
                                      value={editStreakThreshold}
                                      onChange={(e) => setEditStreakThreshold(Math.max(1, Number(e.target.value) || 1))}
                                      className="w-20 border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                    <span className="text-sm">purchases within</span>
                                    <input
                                      type="number"
                                      min={1}
                                      value={editRewardWindowDays}
                                      onChange={(e) => setEditRewardWindowDays(Math.max(1, Number(e.target.value) || 1))}
                                      className="w-20 border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                    <span className="text-sm">days</span>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Reward description"
                                    value={editRewardDescription}
                                    onChange={(e) => setEditRewardDescription(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {(currentLoyaltyType === 'POINTS' || currentLoyaltyType === 'HYBRID' || (isEditing && (editLoyaltyType === 'POINTS' || editLoyaltyType === 'HYBRID'))) && (
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Points Percentage</p>
                                {!isEditing && <p className="text-sm text-gray-600 mt-1">{currentPointsPercentage}% of transaction</p>}
                                {isEditing && (
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.1"
                                    value={editPointsPercentage}
                                    onChange={(e) => setEditPointsPercentage(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                                  />
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-medium text-gray-700">Points Expiry</p>
                                {!isEditing && <p className="text-sm text-gray-600 mt-1">{currentPointsExpiryDays === 0 ? 'Never expire' : `${currentPointsExpiryDays} days`}</p>}
                                {isEditing && (
                                  <input
                                    type="number"
                                    min={0}
                                    value={editPointsExpiryDays}
                                    onChange={(e) => setEditPointsExpiryDays(Math.max(0, Number(e.target.value) || 0))}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                                  />
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-medium text-gray-700">Redemption Ratio</p>
                                {!isEditing && <p className="text-sm text-gray-600 mt-1">{currentPointsToRewardRatio} points = 1 reward</p>}
                                {isEditing && (
                                  <input
                                    type="number"
                                    min={1}
                                    value={editPointsToRewardRatio}
                                    onChange={(e) => setEditPointsToRewardRatio(Math.max(1, Number(e.target.value) || 1))}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                                  />
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-medium text-gray-700">Min Redemption</p>
                                {!isEditing && <p className="text-sm text-gray-600 mt-1">{currentMinimumRedemptionPoints} points</p>}
                                {isEditing && (
                                  <input
                                    type="number"
                                    min={0}
                                    value={editMinimumRedemptionPoints}
                                    onChange={(e) => setEditMinimumRedemptionPoints(Math.max(0, Number(e.target.value) || 0))}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                                  />
                                )}
                              </div>
                            </div>

                            {!isEditing && (!b.settingsLocked || (auth.type === 'platform' && auth.user.role === 'SUPER_ADMIN')) && (
                              <Button
                                variant="secondary"
                                className="text-sm px-4 py-1.5"
                                onClick={() => {
                                  setEditingBranchId(b.id);
                                  setEditLoyaltyType(currentLoyaltyType);
                                  setEditCooldownHours(currentCooldownHours);
                                  setEditCooldownMinutes(currentCooldownMinutes);
                                  setEditStreakThreshold(currentThreshold);
                                  setEditRewardWindowDays(currentWindowDays);
                                  setEditRewardDescription(currentRewardDesc);
                                  setEditMinCheckInAmount(currentMinAmount != null ? String(currentMinAmount) : '');
                                  setEditPointsPercentage(currentPointsPercentage);
                                  setEditPointsExpiryDays(currentPointsExpiryDays);
                                  setEditPointsToRewardRatio(currentPointsToRewardRatio);
                                  setEditMinimumRedemptionPoints(currentMinimumRedemptionPoints);
                                }}
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        )}

                        {isEditing && (
                          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                            <Button
                              disabled={editSubmitting}
                              onClick={async () => {
                                setEditSubmitting(true);
                                setError('');
                                try {
                                  const minAmountVal = editMinCheckInAmount.trim() ? Number(editMinCheckInAmount) : undefined;
                                  await branchesApi.update(b.id, {
                                    loyaltyType: editLoyaltyType,
                                    settings: {
                                      ...settings,
                                      cooldownMinutes: Math.min(48 * 60, editCooldownHours * 60 + editCooldownMinutes),
                                      streakThreshold: editStreakThreshold,
                                      rewardWindowDays: editRewardWindowDays,
                                      rewardDescription: editRewardDescription || undefined,
                                      minCheckInAmount: minAmountVal != null && !Number.isNaN(minAmountVal) && minAmountVal >= 0 ? minAmountVal : undefined,
                                      walletEnabled: editLoyaltyType === 'POINTS' || editLoyaltyType === 'HYBRID',
                                      pointsPercentage: editPointsPercentage,
                                      pointsExpiryDays: editPointsExpiryDays,
                                      pointsToRewardRatio: editPointsToRewardRatio,
                                      minimumRedemptionPoints: editMinimumRedemptionPoints,
                                    },
                                  });
                                  setEditingBranchId(null);
                                  load();
                                } catch (e) {
                                  setError(e instanceof Error ? e.message : 'Failed to update');
                                } finally {
                                  setEditSubmitting(false);
                                }
                              }}
                              className="min-h-[40px]"
                            >
                              {editSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button variant="secondary" onClick={() => setEditingBranchId(null)} className="min-h-[40px]">
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">Customer Check-in QR</p>
                      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <QRCodeSVG value={scanUrl} size={140} level="M" includeMargin />
                      </div>
                      <p className="text-xs text-gray-500 mt-3 text-center">Scan to check-in</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
