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
  const [walletEnabled, setWalletEnabled] = useState(false);
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

  // Only show partners owned by the current user so created branches appear in the list
  const myPartners =
    auth.type === 'platform'
      ? partners.filter((p) => p.ownerId === auth.user.id)
      : partners;

  const load = () => {
    setLoading(true);
    setError('');
    // Backend already filters branches by the logged-in owner
    Promise.all([partnersApi.list(), branchesApi.list()])
      .then(([p, b]) => {
        setPartners(Array.isArray(p) ? p : []);
        const list = Array.isArray(b) ? b : [];
        // Show list immediately so newly created branch is visible
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
        // Enrich with full details (partner + staff) in the background
        Promise.all(list.map((br) => branchesApi.get(br.id)))
          .then((details) => setBranches(details as BranchWithDetails[]))
          .catch(() => { /* keep list from list() so new branch stays visible */ })
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
      setWalletEnabled(false);
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
    <div className="min-w-0">
      <h1 className="text-lg font-bold mb-3 md:text-2xl md:mb-4">Branches</h1>
      {error && <p className="text-red-600 mb-2 text-sm">{error}</p>}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="mb-3 md:mb-4 min-h-[44px] w-full sm:w-auto">
          Add Branch
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-3 mb-3 md:p-4 md:mb-4 max-w-md w-full">
          {myPartners.length === 0 && (
            <p className="text-amber-600 text-sm mb-2">Create a store (partner) first from the admin or dashboard.</p>
          )}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
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

          <div className="mt-4 p-4 rounded-lg border-2 border-cyan-200 bg-cyan-50">
            <label className="block text-sm font-semibold text-gray-900 mb-2">🎯 Loyalty System Type</label>
            <p className="text-xs text-gray-600 mb-3">Choose ONE loyalty mechanism for this branch. This determines how customers earn rewards.</p>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border-2 transition cursor-pointer hover:bg-white" style={{ borderColor: loyaltyType === 'VISITS' ? '#06b6d4' : '#e5e7eb', backgroundColor: loyaltyType === 'VISITS' ? '#ecfeff' : 'white' }}>
                <input
                  type="radio"
                  name="loyaltyType"
                  value="VISITS"
                  checked={loyaltyType === 'VISITS'}
                  onChange={(e) => setLoyaltyType(e.target.value as 'VISITS')}
                  className="mt-1 w-4 h-4"
                />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">🎫 Visit-Based (Stamp Card)</div>
                  <div className="text-xs text-gray-600 mt-0.5">Customers earn rewards after X visits (e.g., 10 visits = 1 free item)</div>
                  <div className="text-xs text-cyan-600 mt-1">✓ Best for: Coffee shops, salons, small retail</div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border-2 transition cursor-pointer hover:bg-white" style={{ borderColor: loyaltyType === 'POINTS' ? '#06b6d4' : '#e5e7eb', backgroundColor: loyaltyType === 'POINTS' ? '#ecfeff' : 'white' }}>
                <input
                  type="radio"
                  name="loyaltyType"
                  value="POINTS"
                  checked={loyaltyType === 'POINTS'}
                  onChange={(e) => setLoyaltyType(e.target.value as 'POINTS')}
                  className="mt-1 w-4 h-4"
                />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">💰 Points-Based (Wallet)</div>
                  <div className="text-xs text-gray-600 mt-0.5">Customers earn points based on spending (e.g., 5% of purchase = points)</div>
                  <div className="text-xs text-cyan-600 mt-1">✓ Best for: Restaurants, retail, variable spending</div>
                </div>
              </label>
            </div>
          </div>

          {loyaltyType === 'VISITS' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-900 font-medium">📋 Visit-Based Settings Below</p>
              <p className="text-xs text-blue-700 mt-1">Configure streak threshold, window days, and reward description</p>
            </div>
          )}
          {loyaltyType === 'POINTS' && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-xs text-emerald-900 font-medium">💳 Points-Based Settings Below</p>
              <p className="text-xs text-emerald-700 mt-1">Configure points percentage, expiry, and redemption ratio</p>
            </div>
          )}

          {loyaltyType === 'VISITS' && (
            <>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cooldown (hours and/or minutes)</label>
                <p className="text-xs text-gray-500 mb-1">0 = no cooldown. Max 48 h. Next check-in allowed after this from last approved visit.</p>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min={0}
                    max={48}
                    value={cooldownHours}
                    onChange={(e) => setCooldownHours(Math.max(0, Math.min(48, Number(e.target.value) ?? 0)))}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <span>hrs</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={cooldownMinutes}
                    onChange={(e) => setCooldownMinutes(Math.max(0, Math.min(59, Number(e.target.value) ?? 0)))}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <span>min</span>
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reward: visits needed</label>
                <p className="text-xs text-gray-500 mb-1">Number of approved visits in the window to earn one reward.</p>
                <input
                  type="number"
                  min={1}
                  value={streakThreshold}
                  onChange={(e) => setStreakThreshold(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reward: window (days)</label>
                <p className="text-xs text-gray-500 mb-1">Count visits within this many days from the first visit in the period.</p>
                <input
                  type="number"
                  min={1}
                  value={rewardWindowDays}
                  onChange={(e) => setRewardWindowDays(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reward description</label>
                <input
                  type="text"
                  placeholder="e.g. 1 free coffee"
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </>
          )}

          {loyaltyType === 'POINTS' && (
            <>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Points percentage</label>
                <p className="text-xs text-gray-500 mb-1">% of transaction value earned as points (e.g., 5% of ₹100 = 5 points)</p>
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
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Points expiry (days)</label>
                <p className="text-xs text-gray-500 mb-1">Points expire after this many days. 0 = never expire.</p>
                <input
                  type="number"
                  min={0}
                  value={pointsExpiryDays}
                  onChange={(e) => setPointsExpiryDays(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Points to reward ratio</label>
                <p className="text-xs text-gray-500 mb-1">How many points needed for 1 reward (e.g., 100 points = 1 reward)</p>
                <input
                  type="number"
                  min={1}
                  value={pointsToRewardRatio}
                  onChange={(e) => setPointsToRewardRatio(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum redemption points</label>
                <p className="text-xs text-gray-500 mb-1">Minimum points needed to redeem (prevents small redemptions)</p>
                <input
                  type="number"
                  min={0}
                  value={minimumRedemptionPoints}
                  onChange={(e) => setMinimumRedemptionPoints(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Min check-in amount</label>
                <p className="text-xs text-gray-500 mb-1">Minimum transaction value to earn points. Leave empty for no minimum.</p>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 100"
                  value={minCheckInAmount}
                  onChange={(e) => setMinCheckInAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </>
          )}

          <div className="hidden mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">💰 Wallet Points System (LEGACY - HIDDEN)</h3>
            <div className="mb-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={walletEnabled}
                  onChange={(e) => setWalletEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Enable wallet points</span>
              </label>
              <p className="text-xs text-gray-500 ml-6 mt-0.5">Customers earn points from transaction amounts that can be redeemed for rewards.</p>
            </div>

            {walletEnabled && (
              <>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points percentage</label>
                  <p className="text-xs text-gray-500 mb-1">% of transaction value earned as points (e.g., 5% of ₹100 = 5 points)</p>
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
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points expiry (days)</label>
                  <p className="text-xs text-gray-500 mb-1">Points expire after this many days. 0 = never expire.</p>
                  <input
                    type="number"
                    min={0}
                    value={pointsExpiryDays}
                    onChange={(e) => setPointsExpiryDays(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points to reward ratio</label>
                  <p className="text-xs text-gray-500 mb-1">How many points needed for 1 reward (e.g., 100 points = 1 reward)</p>
                  <input
                    type="number"
                    min={1}
                    value={pointsToRewardRatio}
                    onChange={(e) => setPointsToRewardRatio(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum redemption points</label>
                  <p className="text-xs text-gray-500 mb-1">Minimum points needed to redeem (prevents small redemptions)</p>
                  <input
                    type="number"
                    min={0}
                    value={minimumRedemptionPoints}
                    onChange={(e) => setMinimumRedemptionPoints(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button type="submit" disabled={submitting} className="min-h-[44px] flex-1 sm:flex-none">Create</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="min-h-[44px] flex-1 sm:flex-none">Cancel</Button>
          </div>
        </form>
      )}
      <div className="space-y-4 md:space-y-6">
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
          const location = b.location as { lat: number; lng: number } | undefined;
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
            <div key={b.id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 min-w-0">
              <div className="p-3 md:p-4 flex flex-col md:flex-row flex-wrap gap-4 md:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-lg text-gray-900">{b.branchName}</h2>
                    {currentLoyaltyType === 'VISITS' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        🎫 Visit-Based
                      </span>
                    )}
                    {currentLoyaltyType === 'POINTS' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                        💰 Points-Based
                      </span>
                    )}
                    {currentLoyaltyType === 'HYBRID' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        🔄 Hybrid
                      </span>
                    )}
                    {b.settingsLocked && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        🔒 Locked
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">ID: {b.id}</p>

                  {auth.type === 'platform' && auth.user.role === 'SUPER_ADMIN' && (
                    <div className="mt-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
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
                        <span className="font-medium text-gray-700">
                          🔐 Lock settings (prevents store owner from editing)
                        </span>
                      </label>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Store:</strong> {b.partner?.businessName ?? b.partnerId}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Staff:</strong> {staffCount}
                  </p>

                  <div className="mt-3 text-sm text-gray-600">
                    <strong>Loyalty Type:</strong>{' '}
                    {isEditing ? (
                      <span className="inline-flex flex-wrap items-center gap-2 mt-1">
                        <select
                          value={editLoyaltyType}
                          onChange={(e) => setEditLoyaltyType(e.target.value as 'VISITS' | 'POINTS' | 'HYBRID')}
                          className="border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="VISITS">🎫 Visit-Based (Stamp Card)</option>
                          <option value="POINTS">💰 Points-Based (Wallet)</option>
                        </select>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        {currentLoyaltyType === 'VISITS' && '🎫 Visit-Based (Stamp Card)'}
                        {currentLoyaltyType === 'POINTS' && '💰 Points-Based (Wallet)'}
                        {currentLoyaltyType === 'HYBRID' && '🔄 Hybrid (Both Systems)'}
                      </span>
                    )}
                  </div>

                  {b.settingsLocked && !(auth.type === 'platform' && auth.user.role === 'SUPER_ADMIN') && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                      🔒 Settings are locked by admin. Contact admin to make changes.
                    </div>
                  )}

                  {(currentLoyaltyType === 'VISITS' || (isEditing && editLoyaltyType === 'VISITS')) && (
                    <>
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Cooldown:</strong>{' '}
                    {isEditing ? (
                      <span className="inline-flex flex-wrap items-center gap-2 mt-1">
                        <input
                          type="number"
                          min={0}
                          max={48}
                          value={editCooldownHours}
                          onChange={(e) => setEditCooldownHours(Math.max(0, Math.min(48, Number(e.target.value) ?? 0)))}
                          className="w-16 border border-gray-300 rounded px-2 py-1"
                        />
                        <span>hrs</span>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={editCooldownMinutes}
                          onChange={(e) => setEditCooldownMinutes(Math.max(0, Math.min(59, Number(e.target.value) ?? 0)))}
                          className="w-16 border border-gray-300 rounded px-2 py-1"
                        />
                        <span>min (0 = no cooldown, max 48 h)</span>
                        <Button
                          className="text-sm px-2 py-1"
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
                        >
                          Save
                        </Button>
                        <Button className="text-sm px-2 py-1" variant="secondary" onClick={() => setEditingBranchId(null)}>
                          Cancel
                        </Button>
                      </span>
                    ) : (
                      <>
                        <span>{cooldownLabel === 'No cooldown' ? cooldownLabel : `${cooldownLabel} — next check-in allowed after this from last approved visit.`}</span>
                        {(!b.settingsLocked || (auth.type === 'platform' && auth.user.role === 'SUPER_ADMIN')) && (
                          <Button
                          variant="secondary"
                          className="ml-2 text-sm px-2 py-1"
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
                          Change
                        </Button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Reward rule:</strong>{' '}
                    {isEditing ? (
                      <span className="block mt-1">
                        <span className="inline-flex flex-wrap items-center gap-2">
                        <span>Purchases needed:</span>
                        <input
                          type="number"
                          min={1}
                          value={editStreakThreshold}
                          onChange={(e) => setEditStreakThreshold(Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 border border-gray-300 rounded px-2 py-1"
                        />
                        <span>within</span>
                        <input
                          type="number"
                          min={1}
                          value={editRewardWindowDays}
                          onChange={(e) => setEditRewardWindowDays(Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 border border-gray-300 rounded px-2 py-1"
                        />
                        <span>days. Description:</span>
                        <input
                          type="text"
                          placeholder="e.g. 1 free family pack"
                          value={editRewardDescription}
                          onChange={(e) => setEditRewardDescription(e.target.value)}
                          className="flex-1 min-w-[120px] border border-gray-300 rounded px-2 py-1"
                        />
                        </span>
                      </span>
                    ) : (
                      <>
                        <span>{currentThreshold} purchases in {currentWindowDays} days → {currentRewardDesc || 'Free reward'}</span>
                        {(!b.settingsLocked || (auth.type === 'platform' && auth.user.role === 'SUPER_ADMIN')) && (
                          <Button
                          variant="secondary"
                          className="ml-2 text-sm px-2 py-1"
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
                          Change
                        </Button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Min check-in amount:</strong>{' '}
                    {isEditing ? (
                      <span className="inline-flex flex-wrap items-center gap-2 mt-1">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="No minimum"
                          value={editMinCheckInAmount}
                          onChange={(e) => setEditMinCheckInAmount(e.target.value)}
                          className="w-24 border border-gray-300 rounded px-2 py-1"
                        />
                        <span className="text-gray-500">(user cannot enter amount below this; empty = no minimum)</span>
                      </span>
                    ) : (
                      currentMinAmount != null && currentMinAmount > 0 ? `${currentMinAmount}` : 'No minimum'
                    )}
                  </div>
                    </>
                  )}

                  {(currentLoyaltyType === 'POINTS' || (isEditing && editLoyaltyType === 'POINTS')) && (
                    <>
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Points percentage:</strong>{' '}
                        {isEditing ? (
                          <span className="inline-flex flex-wrap items-center gap-2 mt-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step="0.1"
                              value={editPointsPercentage}
                              onChange={(e) => setEditPointsPercentage(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                              className="w-20 border border-gray-300 rounded px-2 py-1"
                            />
                            <span>% (earn {editPointsPercentage}% of transaction as points)</span>
                          </span>
                        ) : (
                          <>
                            <span>{currentPointsPercentage}% of transaction value</span>
                            {(!b.settingsLocked || (auth.type === 'platform' && auth.user.role === 'SUPER_ADMIN')) && (
                              <Button
                              variant="secondary"
                              className="ml-2 text-sm px-2 py-1"
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
                              Change
                            </Button>
                            )}
                          </>
                        )}
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Points expiry:</strong>{' '}
                        {isEditing ? (
                          <span className="inline-flex flex-wrap items-center gap-2 mt-1">
                            <input
                              type="number"
                              min={0}
                              value={editPointsExpiryDays}
                              onChange={(e) => setEditPointsExpiryDays(Math.max(0, Number(e.target.value) || 0))}
                              className="w-20 border border-gray-300 rounded px-2 py-1"
                            />
                            <span>days (0 = never expire)</span>
                          </span>
                        ) : (
                          <span>{currentPointsExpiryDays === 0 ? 'Never expire' : `${currentPointsExpiryDays} days`}</span>
                        )}
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Points to reward ratio:</strong>{' '}
                        {isEditing ? (
                          <span className="inline-flex flex-wrap items-center gap-2 mt-1">
                            <input
                              type="number"
                              min={1}
                              value={editPointsToRewardRatio}
                              onChange={(e) => setEditPointsToRewardRatio(Math.max(1, Number(e.target.value) || 1))}
                              className="w-20 border border-gray-300 rounded px-2 py-1"
                            />
                            <span>points = 1 reward</span>
                          </span>
                        ) : (
                          <span>{currentPointsToRewardRatio} points = 1 reward</span>
                        )}
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Minimum redemption:</strong>{' '}
                        {isEditing ? (
                          <span className="inline-flex flex-wrap items-center gap-2 mt-1">
                            <input
                              type="number"
                              min={0}
                              value={editMinimumRedemptionPoints}
                              onChange={(e) => setEditMinimumRedemptionPoints(Math.max(0, Number(e.target.value) || 0))}
                              className="w-20 border border-gray-300 rounded px-2 py-1"
                            />
                            <span>points required to redeem</span>
                          </span>
                        ) : (
                          <span>{currentMinimumRedemptionPoints} points</span>
                        )}
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Min check-in amount:</strong>{' '}
                        {isEditing ? (
                          <span className="inline-flex flex-wrap items-center gap-2 mt-1">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="No minimum"
                              value={editMinCheckInAmount}
                              onChange={(e) => setEditMinCheckInAmount(e.target.value)}
                              className="w-24 border border-gray-300 rounded px-2 py-1"
                            />
                            <span className="text-gray-500">(minimum transaction to earn points)</span>
                          </span>
                        ) : (
                          currentMinAmount != null && currentMinAmount > 0 ? `₹${currentMinAmount}` : 'No minimum'
                        )}
                      </div>

                      {isEditing && (
                        <div className="mt-4 flex gap-2">
                          <Button
                            className="text-sm px-3 py-1.5"
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
                          >
                            Save All Changes
                          </Button>
                          <Button className="text-sm px-3 py-1.5" variant="secondary" onClick={() => setEditingBranchId(null)}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {location && (
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Location:</strong> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-center shrink-0">
                  <p className="text-xs text-gray-500 mb-2">Scan to check-in</p>
                  <QRCodeSVG value={scanUrl} size={120} level="M" includeMargin className="max-w-full h-auto" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {branches.length === 0 && !showForm && (
        <p className="text-gray-500">No branches yet.</p>
      )}
    </div>
  );
}
