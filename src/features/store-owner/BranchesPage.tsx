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
  const [cooldownHours, setCooldownHours] = useState(0);
  const [streakThreshold, setStreakThreshold] = useState<number>(5);
  const [rewardWindowDays, setRewardWindowDays] = useState<number>(30);
  const [rewardDescription, setRewardDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editCooldown, setEditCooldown] = useState<number>(0);
  const [editStreakThreshold, setEditStreakThreshold] = useState<number>(5);
  const [editRewardWindowDays, setEditRewardWindowDays] = useState<number>(30);
  const [editRewardDescription, setEditRewardDescription] = useState('');
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
      await branchesApi.create({
        branchName,
        partnerId,
        settings: {
          cooldownHours,
          streakThreshold,
          rewardWindowDays,
          rewardDescription: rewardDescription || undefined,
        },
      });
      setBranchName('');
      setCooldownHours(0);
      setStreakThreshold(5);
      setRewardWindowDays(30);
      setRewardDescription('');
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading…</p>;


  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Branches</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="mb-4">
          Add Branch
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-4 mb-4 max-w-md">
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
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cooldown (hours)</label>
            <p className="text-xs text-gray-500 mb-1">0 = no cooldown. Max 48 (2 days). Next check-in allowed after this many hours from last approved visit.</p>
            <input
              type="number"
              min={0}
              max={48}
              value={cooldownHours}
              onChange={(e) => setCooldownHours(Math.max(0, Math.min(48, Number(e.target.value) ?? 0)))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reward: purchases needed</label>
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
            <p className="text-xs text-gray-500 mb-1">Count purchases within this many days from the first purchase in the period.</p>
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
              placeholder="e.g. 1 free family pack"
              value={rewardDescription}
              onChange={(e) => setRewardDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={submitting}>Create</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}
      <div className="space-y-6">
        {branches.map((b) => {
          const settings = b.settings as {
            streakThreshold?: number;
            cooldownHours?: number;
            rewardWindowDays?: number;
            rewardDescription?: string;
          } | undefined;
          const location = b.location as { lat: number; lng: number } | undefined;
          const staffCount = Array.isArray(b.staff) ? b.staff.length : 0;
          const scanUrl = typeof window !== 'undefined' ? `${window.location.origin}/scan/${b.id}` : '';
          const currentCooldown = settings?.cooldownHours ?? 0;
          const currentThreshold = settings?.streakThreshold ?? 5;
          const currentWindowDays = settings?.rewardWindowDays ?? 30;
          const currentRewardDesc = settings?.rewardDescription ?? '';
          const isEditing = editingBranchId === b.id;
          return (
            <div key={b.id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <div className="p-4 flex flex-wrap gap-6">
                <div className="flex-1 min-w-[200px]">
                  <h2 className="font-semibold text-lg text-gray-900">{b.branchName}</h2>
                  <p className="text-sm text-gray-500 mt-1">ID: {b.id}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Store:</strong> {b.partner?.businessName ?? b.partnerId}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Staff:</strong> {staffCount}
                  </p>
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Cooldown:</strong>{' '}
                    {isEditing ? (
                      <span className="inline-flex flex-wrap items-center gap-2 mt-1">
                        <input
                          type="number"
                          min={0}
                          max={48}
                          value={editCooldown}
                          onChange={(e) => setEditCooldown(Math.max(0, Math.min(48, Number(e.target.value) ?? 0)))}
                          className="w-20 border border-gray-300 rounded px-2 py-1"
                        />
                        <span>hours (0 = no cooldown, max 2 days)</span>
                        <Button
                          className="text-sm px-2 py-1"
                          disabled={editSubmitting}
                          onClick={async () => {
                            setEditSubmitting(true);
                            setError('');
                            try {
                              await branchesApi.update(b.id, {
                                settings: {
                                  ...settings,
                                  cooldownHours: editCooldown,
                                  streakThreshold: editStreakThreshold,
                                  rewardWindowDays: editRewardWindowDays,
                                  rewardDescription: editRewardDescription || undefined,
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
                        <span>{currentCooldown === 0 ? 'No cooldown' : `${currentCooldown}h — next check-in allowed after ${currentCooldown} hours from last approved visit.`}</span>
                        <Button
                          variant="secondary"
                          className="ml-2 text-sm px-2 py-1"
                          onClick={() => {
                            setEditingBranchId(b.id);
                            setEditCooldown(currentCooldown);
                            setEditStreakThreshold(currentThreshold);
                            setEditRewardWindowDays(currentWindowDays);
                            setEditRewardDescription(currentRewardDesc);
                          }}
                        >
                          Change
                        </Button>
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
                        <Button
                          variant="secondary"
                          className="ml-2 text-sm px-2 py-1"
                          onClick={() => {
                            setEditingBranchId(b.id);
                            setEditCooldown(currentCooldown);
                            setEditStreakThreshold(currentThreshold);
                            setEditRewardWindowDays(currentWindowDays);
                            setEditRewardDescription(currentRewardDesc);
                          }}
                        >
                          Change
                        </Button>
                      </>
                    )}
                  </div>
                  {location && (
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Location:</strong> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-xs text-gray-500 mb-2">Scan to check-in</p>
                  <QRCodeSVG value={scanUrl} size={120} level="M" includeMargin />
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
