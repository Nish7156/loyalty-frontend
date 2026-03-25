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
  const [amountPerCoin, setAmountPerCoin] = useState<number>(10);
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
  const [editAmountPerCoin, setEditAmountPerCoin] = useState<number>(10);
  const [editPointsExpiryDays, setEditPointsExpiryDays] = useState<number>(365);
  const [editPointsToRewardRatio, setEditPointsToRewardRatio] = useState<number>(100);
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
          amountPerCoin,
          pointsPercentage: undefined, // not used with amountPerCoin
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
      setAmountPerCoin(10);
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

  if (loading) return <p className="text-sm md:text-base p-2" style={{ color: 'var(--t2)' }}>Loading…</p>;

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6" style={{ background: 'var(--bg)' }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--t)' }}>Branches</h1>
        <p style={{ color: 'var(--t2)' }}>Manage your branch locations and loyalty settings</p>
      </div>

      {!showForm && (
        <div className="mb-6">
          <Button onClick={() => setShowForm(true)} className="min-h-[44px]" style={{ background: 'var(--a)', color: 'var(--s)' }}>
            <span className="material-symbols-rounded mr-1" style={{ fontSize: '20px' }}>add</span> Add Branch
          </Button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm" style={{ background: 'var(--rebg)', border: '1px solid var(--bd)', color: 'var(--re)' }}>
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 rounded-2xl p-6" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--t)' }}>Create New Branch</h2>
          <form onSubmit={handleCreate} className="max-w-2xl">
            {myPartners.length === 0 && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#FFF8E1', border: '1px solid #FFE082', color: 'var(--t)' }}>
                Create a store (partner) first from the admin or dashboard.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t)' }}>Store</label>
                <select
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2"
                  style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }}
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

            <div className="mt-6 p-5 rounded-xl" style={{ border: '2px solid var(--bd)', background: 'var(--bdl)' }}>
              <label className="block text-base font-bold mb-2.5" style={{ color: 'var(--t)' }}>
                <span className="material-symbols-rounded mr-1" style={{ fontSize: '18px', verticalAlign: 'text-bottom' }}>target</span>
                Loyalty System Type
              </label>
              <p className="text-sm mb-4" style={{ color: 'var(--t2)' }}>Choose ONE loyalty mechanism for this branch</p>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 rounded-xl transition-all cursor-pointer"
                  style={{
                    border: loyaltyType === 'VISITS' ? '2px solid var(--a)' : '2px solid var(--bd)',
                    background: loyaltyType === 'VISITS' ? 'var(--s)' : 'var(--s)',
                    boxShadow: loyaltyType === 'VISITS' ? '0 4px 6px -1px rgba(216,90,48,0.1)' : 'none'
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
                    <div className="font-semibold text-base" style={{ color: 'var(--t)' }}>
                      <span className="material-symbols-rounded mr-1" style={{ fontSize: '16px', verticalAlign: 'text-bottom' }}>confirmation_number</span>
                      Visit-Based (Stamp Card)
                    </div>
                    <div className="text-sm mt-1" style={{ color: 'var(--t2)' }}>Customers earn rewards after X visits</div>
                    <div className="text-xs mt-1.5 font-medium" style={{ color: 'var(--a)' }}>Best for: Coffee shops, salons, small retail</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl transition-all cursor-pointer"
                  style={{
                    border: loyaltyType === 'POINTS' ? '2px solid var(--a)' : '2px solid var(--bd)',
                    background: loyaltyType === 'POINTS' ? 'var(--s)' : 'var(--s)',
                    boxShadow: loyaltyType === 'POINTS' ? '0 4px 6px -1px rgba(216,90,48,0.1)' : 'none'
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
                    <div className="font-semibold text-base" style={{ color: 'var(--t)' }}>
                      <span className="material-symbols-rounded mr-1" style={{ fontSize: '16px', verticalAlign: 'text-bottom' }}>payments</span>
                      Points-Based (Wallet)
                    </div>
                    <div className="text-sm mt-1" style={{ color: 'var(--t2)' }}>Customers earn points based on spending</div>
                    <div className="text-xs mt-1.5 font-medium" style={{ color: 'var(--a)' }}>Best for: Restaurants, retail, variable spending</div>
                  </div>
                </label>
              </div>
            </div>

            {loyaltyType === 'VISITS' && (
              <div className="mt-4 p-4 rounded-lg" style={{ background: 'var(--bdl)', border: '1px solid var(--bd)' }}>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t)' }}>Cooldown (hours and/or minutes)</label>
                    <p className="text-xs mb-2" style={{ color: 'var(--t3)' }}>Next check-in allowed after this from last approved visit</p>
                    <div className="flex gap-3 items-center">
                      <input type="number" min={0} max={48} value={cooldownHours} onChange={(e) => setCooldownHours(Math.max(0, Math.min(48, Number(e.target.value) ?? 0)))} className="w-20 rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--t)' }}>hrs</span>
                      <input type="number" min={0} max={59} value={cooldownMinutes} onChange={(e) => setCooldownMinutes(Math.max(0, Math.min(59, Number(e.target.value) ?? 0)))} className="w-20 rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--t)' }}>min</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t)' }}>Visits needed for reward</label>
                    <input type="number" min={1} value={streakThreshold} onChange={(e) => setStreakThreshold(Math.max(1, Number(e.target.value) || 1))} className="w-full rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t)' }}>Reward window (days)</label>
                    <input type="number" min={1} value={rewardWindowDays} onChange={(e) => setRewardWindowDays(Math.max(1, Number(e.target.value) || 1))} className="w-full rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t)' }}>Reward description</label>
                    <input type="text" placeholder="e.g. 1 free coffee" value={rewardDescription} onChange={(e) => setRewardDescription(e.target.value)} className="w-full rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                  </div>
                </div>
              </div>
            )}

            {loyaltyType === 'POINTS' && (
              <div className="mt-4 p-4 rounded-lg" style={{ background: 'var(--grbg)', border: '1px solid rgba(42,96,64,0.2)' }}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t)' }}>Amount per coin (₹)</label>
                    <p className="text-xs mb-2" style={{ color: 'var(--t3)' }}>Customer earns 1 coin for every ₹X spent</p>
                    <input type="number" min={1} step="1" value={amountPerCoin} onChange={(e) => setAmountPerCoin(Math.max(1, Number(e.target.value) || 1))} className="w-full rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                    <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--a)' }}>Example: ₹{amountPerCoin * 5} purchase = {5} coins</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t)' }}>Points expiry (days)</label>
                    <p className="text-xs mb-2" style={{ color: 'var(--t3)' }}>0 = never expire</p>
                    <input type="number" min={0} value={pointsExpiryDays} onChange={(e) => setPointsExpiryDays(Math.max(0, Number(e.target.value) || 0))} className="w-full rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t)' }}>Points to reward ratio</label>
                    <input type="number" min={1} value={pointsToRewardRatio} onChange={(e) => setPointsToRewardRatio(Math.max(1, Number(e.target.value) || 1))} className="w-full rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t)' }}>Minimum redemption points</label>
                    <input type="number" min={0} value={minimumRedemptionPoints} onChange={(e) => setMinimumRedemptionPoints(Math.max(0, Number(e.target.value) || 0))} className="w-full rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--t)' }}>Min check-in amount (optional)</label>
                    <input type="number" min={0} step="0.01" placeholder="No minimum" value={minCheckInAmount} onChange={(e) => setMinCheckInAmount(e.target.value)} className="w-full rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button type="submit" disabled={submitting} className="min-h-[44px]" style={{ background: 'var(--a)', color: 'var(--s)' }}>
                {submitting ? 'Creating...' : 'Create Branch'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="min-h-[44px]" style={{ border: '1px solid var(--bd)', color: 'var(--t)' }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {branches.length === 0 && !showForm ? (
        <div className="text-center py-12 rounded-xl" style={{ background: 'var(--s)', border: '1px solid var(--bdl)' }}>
          <p className="text-lg" style={{ color: 'var(--t2)' }}>No branches yet. Create your first branch to get started!</p>
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
              amountPerCoin?: number;
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
            const currentAmountPerCoin = settings?.amountPerCoin ?? 10;
            const currentPointsExpiryDays = settings?.pointsExpiryDays ?? 365;
            const currentPointsToRewardRatio = settings?.pointsToRewardRatio ?? 100;
            const currentLoyaltyType = b.loyaltyType ?? 'VISITS';
            const isEditing = editingBranchId === b.id;

            return (
              <div key={b.id} className="rounded-xl overflow-hidden transition-shadow hover:shadow-md" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-3">
                        <h2 className="text-2xl font-bold" style={{ color: 'var(--t)' }}>{b.branchName}</h2>

                        {currentLoyaltyType === 'VISITS' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--bdl)', color: 'var(--a)', border: '1px solid var(--bd)' }}>
                            <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '14px' }}>confirmation_number</span> Visit-Based
                          </span>
                        )}
                        {currentLoyaltyType === 'POINTS' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--grbg)', color: 'var(--gr)', border: '1px solid rgba(42,96,64,0.2)' }}>
                            <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '14px' }}>payments</span> Points-Based
                          </span>
                        )}
                        {currentLoyaltyType === 'HYBRID' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--bdl)', color: 'var(--a)', border: '1px solid var(--bd)' }}>
                            <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '14px' }}>sync</span> Hybrid
                          </span>
                        )}
                        {b.settingsLocked && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--rebg)', color: 'var(--re)', border: '1px solid rgba(176,58,42,0.2)' }}>
                            <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '14px' }}>lock</span> Locked
                          </span>
                        )}
                      </div>

                      <div className="grid gap-3 text-sm mb-4">
                        <div className="flex items-center gap-2" style={{ color: 'var(--t2)' }}>
                          <span className="font-medium" style={{ color: 'var(--t)' }}>Store:</span>
                          <span>{b.partner?.businessName ?? b.partnerId}</span>
                        </div>
                        <div className="flex items-center gap-2" style={{ color: 'var(--t2)' }}>
                          <span className="font-medium" style={{ color: 'var(--t)' }}>Staff:</span>
                          <span>{staffCount} {staffCount === 1 ? 'member' : 'members'}</span>
                        </div>
                        <div className="flex items-center gap-2" style={{ color: 'var(--t2)' }}>
                          <span className="font-medium" style={{ color: 'var(--t)' }}>ID:</span>
                          <span className="font-mono text-xs">{b.id}</span>
                        </div>
                      </div>

                      {auth.type === 'platform' && auth.user.role === 'SUPER_ADMIN' && (
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors" style={{ background: 'var(--bg)', border: '1px solid var(--bdl)' }}>
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
                            className="w-4 h-4 rounded"
                            style={{ borderColor: 'var(--bd)' }}
                          />
                          <span className="text-sm font-medium" style={{ color: 'var(--t)' }}>
                            <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '14px', verticalAlign: 'text-bottom' }}>lock</span>
                            Lock settings (prevents store owner from editing)
                          </span>
                        </label>
                      )}

                      {b.settingsLocked && !(auth.type === 'platform' && auth.user.role === 'SUPER_ADMIN') && (
                        <div className="mt-4 p-4 rounded-lg" style={{ background: 'var(--rebg)', border: '1px solid var(--bd)' }}>
                          <p className="text-sm font-medium" style={{ color: 'var(--re)' }}>
                            <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '16px', verticalAlign: 'text-bottom' }}>lock</span>
                            Settings are locked by admin. Contact admin to make changes.
                          </p>
                        </div>
                      )}

                      <div className="mt-6 p-5 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--bdl)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--t)' }}>Loyalty Settings</h3>

                        {(currentLoyaltyType === 'VISITS' || currentLoyaltyType === 'HYBRID' || (isEditing && (editLoyaltyType === 'VISITS' || editLoyaltyType === 'HYBRID'))) && (
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-sm font-medium" style={{ color: 'var(--t)' }}>Cooldown</p>
                                {!isEditing && <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>{cooldownLabel}</p>}
                              </div>
                              {!isEditing && (!b.settingsLocked || (auth.type === 'platform' && auth.user.role === 'SUPER_ADMIN')) && (
                                <Button
                                  variant="secondary"
                                  className="text-sm px-4 py-1.5"
                                  style={{ border: '1px solid var(--bd)', color: 'var(--a)' }}
                                  onClick={() => {
                                    setEditingBranchId(b.id);
                                    setEditLoyaltyType(currentLoyaltyType);
                                    setEditCooldownHours(currentCooldownHours);
                                    setEditCooldownMinutes(currentCooldownMinutes);
                                    setEditStreakThreshold(currentThreshold);
                                    setEditRewardWindowDays(currentWindowDays);
                                    setEditRewardDescription(currentRewardDesc);
                                    setEditMinCheckInAmount(currentMinAmount != null ? String(currentMinAmount) : '');
                                    setEditAmountPerCoin(currentAmountPerCoin);
                                    setEditPointsExpiryDays(currentPointsExpiryDays);
                                    setEditPointsToRewardRatio(currentPointsToRewardRatio);
                                  }}
                                >
                                  <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '14px' }}>edit</span> Edit
                                </Button>
                              )}
                            </div>

                            {isEditing && (
                              <div className="flex gap-3 items-center">
                                <input type="number" min={0} max={48} value={editCooldownHours} onChange={(e) => setEditCooldownHours(Math.max(0, Math.min(48, Number(e.target.value) ?? 0)))} className="w-20 rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                                <span className="text-sm" style={{ color: 'var(--t)' }}>hrs</span>
                                <input type="number" min={0} max={59} value={editCooldownMinutes} onChange={(e) => setEditCooldownMinutes(Math.max(0, Math.min(59, Number(e.target.value) ?? 0)))} className="w-20 rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                                <span className="text-sm" style={{ color: 'var(--t)' }}>min</span>
                              </div>
                            )}

                            <div className="pt-4" style={{ borderTop: '1px solid var(--bdl)' }}>
                              <p className="text-sm font-medium" style={{ color: 'var(--t)' }}>Reward Rule</p>
                              {!isEditing && (
                                <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>
                                  {currentThreshold} purchases in {currentWindowDays} days → {currentRewardDesc || 'Free reward'}
                                </p>
                              )}
                              {isEditing && (
                                <div className="mt-2 space-y-3">
                                  <div className="flex gap-2 items-center">
                                    <input type="number" min={1} value={editStreakThreshold} onChange={(e) => setEditStreakThreshold(Math.max(1, Number(e.target.value) || 1))} className="w-20 rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                                    <span className="text-sm" style={{ color: 'var(--t)' }}>purchases within</span>
                                    <input type="number" min={1} value={editRewardWindowDays} onChange={(e) => setEditRewardWindowDays(Math.max(1, Number(e.target.value) || 1))} className="w-20 rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                                    <span className="text-sm" style={{ color: 'var(--t)' }}>days</span>
                                  </div>
                                  <input type="text" placeholder="Reward description" value={editRewardDescription} onChange={(e) => setEditRewardDescription(e.target.value)} className="w-full rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {(currentLoyaltyType === 'POINTS' || currentLoyaltyType === 'HYBRID' || (isEditing && (editLoyaltyType === 'POINTS' || editLoyaltyType === 'HYBRID'))) && (
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--t)' }}>Amount per Coin (₹)</p>
                                {!isEditing && (
                                  <>
                                    <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>₹{currentAmountPerCoin} = 1 coin</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>e.g. ₹{currentAmountPerCoin * 5} purchase = 5 coins</p>
                                  </>
                                )}
                                {isEditing && (
                                  <>
                                    <input type="number" min={1} step="1" value={editAmountPerCoin} onChange={(e) => setEditAmountPerCoin(Math.max(1, Number(e.target.value) || 1))} className="mt-1 w-full rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                                    <p className="text-xs mt-1 font-medium" style={{ color: 'var(--a)' }}>Example: ₹{editAmountPerCoin * 5} purchase = 5 coins</p>
                                  </>
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--t)' }}>Points Expiry</p>
                                {!isEditing && <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>{currentPointsExpiryDays === 0 ? 'Never expire' : `${currentPointsExpiryDays} days`}</p>}
                                {isEditing && (
                                  <input type="number" min={0} value={editPointsExpiryDays} onChange={(e) => setEditPointsExpiryDays(Math.max(0, Number(e.target.value) || 0))} className="mt-1 w-full rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--t)' }}>Points Per Reward</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>How many points customers need to redeem 1 reward</p>
                                {!isEditing && <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>{currentPointsToRewardRatio} points = 1 reward</p>}
                                {isEditing && (
                                  <div className="mt-1 flex items-center gap-2">
                                    <input type="number" min={1} value={editPointsToRewardRatio} onChange={(e) => setEditPointsToRewardRatio(Math.max(1, Number(e.target.value) || 1))} className="w-24 rounded-lg px-3 py-2" style={{ border: '1px solid var(--bd)', color: 'var(--t)', background: 'var(--s)' }} />
                                    <span className="text-sm" style={{ color: 'var(--t2)' }}>points = 1 reward</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {!isEditing && (!b.settingsLocked || (auth.type === 'platform' && auth.user.role === 'SUPER_ADMIN')) && (
                              <Button
                                variant="secondary"
                                className="text-sm px-4 py-1.5"
                                style={{ border: '1px solid var(--bd)', color: 'var(--a)' }}
                                onClick={() => {
                                  setEditingBranchId(b.id);
                                  setEditLoyaltyType(currentLoyaltyType);
                                  setEditCooldownHours(currentCooldownHours);
                                  setEditCooldownMinutes(currentCooldownMinutes);
                                  setEditStreakThreshold(currentThreshold);
                                  setEditRewardWindowDays(currentWindowDays);
                                  setEditRewardDescription(currentRewardDesc);
                                  setEditMinCheckInAmount(currentMinAmount != null ? String(currentMinAmount) : '');
                                  setEditAmountPerCoin(currentAmountPerCoin);
                                  setEditPointsExpiryDays(currentPointsExpiryDays);
                                  setEditPointsToRewardRatio(currentPointsToRewardRatio);
                                }}
                              >
                                <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '14px' }}>edit</span> Edit
                              </Button>
                            )}
                          </div>
                        )}

                        {isEditing && (
                          <div className="flex gap-3 mt-6 pt-6" style={{ borderTop: '1px solid var(--bdl)' }}>
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
                                      amountPerCoin: editAmountPerCoin,
                                      pointsPercentage: undefined, // remove legacy field when using amountPerCoin
                                      pointsExpiryDays: editPointsExpiryDays,
                                      pointsToRewardRatio: editPointsToRewardRatio,
                                      minimumRedemptionPoints: editPointsToRewardRatio, // min redemption = reward ratio (consistent UX)
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
                              style={{ background: 'var(--a)', color: 'var(--s)' }}
                            >
                              {editSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button variant="secondary" onClick={() => setEditingBranchId(null)} className="min-h-[40px]" style={{ border: '1px solid var(--bd)', color: 'var(--t)' }}>
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-6 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--bdl)' }}>
                      <p className="text-sm font-medium mb-3" style={{ color: 'var(--t)' }}>Customer Check-in QR</p>
                      <div className="p-4 rounded-lg" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
                        <QRCodeSVG value={scanUrl} size={140} level="M" includeMargin />
                      </div>
                      <p className="text-xs mt-3 text-center" style={{ color: 'var(--t3)' }}>Scan to check-in</p>
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
