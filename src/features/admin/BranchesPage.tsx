import { useEffect, useState } from 'react';
import { partnersApi, branchesApi } from '../../lib/api';
import type { Branch, Partner } from '../../lib/api';
import { Button } from '../../components/Button';

type BranchWithDetails = Branch & { partner?: Partner };
type PartnerWithBranches = Partner & { branches?: BranchWithDetails[] };

export function AdminBranchesPage() {
  const [partners, setPartners] = useState<PartnerWithBranches[]>([]);
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingBranches, setLoadingBranches] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    partnersApi
      .list()
      .then(setPartners)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadBranches = async (partnerId: string) => {
    if (loadingBranches[partnerId]) return;

    setLoadingBranches((prev) => ({ ...prev, [partnerId]: true }));
    try {
      const allBranches = await branchesApi.list();
      const partnerBranches = allBranches.filter((b) => b.partnerId === partnerId);

      const details = await Promise.all(
        partnerBranches.map((br) => branchesApi.get(br.id))
      );

      setPartners((prev) =>
        prev.map((p) =>
          p.id === partnerId ? { ...p, branches: details as BranchWithDetails[] } : p
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load branches');
    } finally {
      setLoadingBranches((prev) => ({ ...prev, [partnerId]: false }));
    }
  };

  const togglePartner = (partnerId: string) => {
    if (expandedPartnerId === partnerId) {
      setExpandedPartnerId(null);
    } else {
      setExpandedPartnerId(partnerId);
      const partner = partners.find((p) => p.id === partnerId);
      if (!partner?.branches) {
        loadBranches(partnerId);
      }
    }
  };

  const toggleLock = async (branchId: string, currentLocked: boolean, partnerId: string) => {
    try {
      await branchesApi.update(branchId, { settingsLocked: !currentLocked });
      await loadBranches(partnerId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update lock status');
    }
  };

  if (loading) return <p className="text-sm md:text-base p-2" style={{ color: 'var(--t2)' }}>Loading stores…</p>;

  return (
    <div className="min-w-0">
      <div className="mb-4">
        <h1 className="text-lg font-bold mb-1 md:text-2xl" style={{ color: 'var(--t)' }}>Branch Lock Control</h1>
        <p className="text-sm" style={{ color: 'var(--t2)' }}>Click on a store to manage branch settings locks</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--rebg)', border: '1px solid var(--bd)', color: 'var(--re)' }}>
          {error}
        </div>
      )}

      {partners.length === 0 ? (
        <p style={{ color: 'var(--t3)' }}>No stores found.</p>
      ) : (
        <div className="space-y-3">
          {partners.map((partner) => {
            const isExpanded = expandedPartnerId === partner.id;
            const branches = partner.branches || [];
            const isLoadingBranches = loadingBranches[partner.id];

            return (
              <div key={partner.id} className="rounded-lg" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
                {/* Store Header - Clickable */}
                <button
                  onClick={() => togglePartner(partner.id)}
                  className="w-full p-4 flex items-center justify-between transition-colors text-left rounded-lg"
                  style={{ color: 'var(--t)' }}
                >
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg" style={{ color: 'var(--t)' }}>{partner.businessName}</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>
                      {partner.industryType} • {branches.length > 0 ? `${branches.length} branches` : 'Click to load branches'}
                    </p>
                  </div>
                  <div className="text-2xl" style={{ color: 'var(--t3)' }}>
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </button>

                {/* Branches List - Expanded */}
                {isExpanded && (
                  <div className="p-4" style={{ borderTop: '1px solid var(--bdl)', background: 'var(--bg)' }}>
                    {isLoadingBranches && (
                      <p className="text-sm" style={{ color: 'var(--t3)' }}>Loading branches...</p>
                    )}

                    {!isLoadingBranches && branches.length === 0 && (
                      <p className="text-sm" style={{ color: 'var(--t3)' }}>No branches for this store.</p>
                    )}

                    {!isLoadingBranches && branches.length > 0 && (
                      <div className="space-y-3">
                        {branches.map((branch) => {
                          const loyaltyType = branch.loyaltyType ?? 'VISITS';
                          const isLocked = branch.settingsLocked ?? false;

                          return (
                            <div
                              key={branch.id}
                              className="rounded-lg p-4"
                              style={{ background: 'var(--s)', border: '1px solid var(--bdl)' }}
                            >
                              <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <h3 className="font-semibold text-base" style={{ color: 'var(--t)' }}>
                                      {branch.branchName}
                                    </h3>

                                    {loyaltyType === 'VISITS' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--bdl)', color: 'var(--a)', border: '1px solid var(--bd)' }}>
                                        <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '12px' }}>confirmation_number</span> Visit-Based
                                      </span>
                                    )}
                                    {loyaltyType === 'POINTS' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--grbg)', color: 'var(--gr)', border: '1px solid rgba(42,96,64,0.2)' }}>
                                        <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '12px' }}>payments</span> Points-Based
                                      </span>
                                    )}
                                    {loyaltyType === 'HYBRID' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--bdl)', color: 'var(--a)', border: '1px solid var(--bd)' }}>
                                        <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '12px' }}>sync</span> Hybrid
                                      </span>
                                    )}

                                    {isLocked ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--rebg)', color: 'var(--re)', border: '1px solid rgba(176,58,42,0.2)' }}>
                                        <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '12px' }}>lock</span> Locked
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--grbg)', color: 'var(--gr)', border: '1px solid rgba(42,96,64,0.2)' }}>
                                        <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '12px' }}>lock_open</span> Unlocked
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-xs" style={{ color: 'var(--t3)' }}>ID: {branch.id}</p>
                                </div>

                                <div className="shrink-0">
                                  {isLocked ? (
                                    <Button
                                      variant="secondary"
                                      className="min-h-[40px] text-sm"
                                      onClick={() => toggleLock(branch.id, isLocked, partner.id)}
                                      style={{ border: '1px solid var(--bd)', color: 'var(--t)' }}
                                    >
                                      <span className="material-symbols-rounded mr-1" style={{ fontSize: '16px' }}>lock_open</span> Unlock
                                    </Button>
                                  ) : (
                                    <Button
                                      className="min-h-[40px] text-sm"
                                      onClick={() => toggleLock(branch.id, isLocked, partner.id)}
                                      style={{ background: 'var(--re)', color: 'var(--s)' }}
                                    >
                                      <span className="material-symbols-rounded mr-1" style={{ fontSize: '16px' }}>lock</span> Lock
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Settings Preview */}
                              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--bdl)' }}>
                                <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--t2)' }}>
                                  {loyaltyType === 'VISITS' && (
                                    <>
                                      <div>Threshold: {branch.settings?.streakThreshold ?? 5} visits</div>
                                      <div>Window: {branch.settings?.rewardWindowDays ?? 30} days</div>
                                    </>
                                  )}
                                  {loyaltyType === 'POINTS' && (
                                    <>
                                      <div>Points: {branch.settings?.pointsPercentage ?? 5}%</div>
                                      <div>Expiry: {branch.settings?.pointsExpiryDays ?? 365} days</div>
                                    </>
                                  )}
                                  {loyaltyType === 'HYBRID' && (
                                    <>
                                      <div>Visits: {branch.settings?.streakThreshold ?? 5} threshold</div>
                                      <div>Points: {branch.settings?.pointsPercentage ?? 5}%</div>
                                      <div>Window: {branch.settings?.rewardWindowDays ?? 30} days</div>
                                      <div>Expiry: {branch.settings?.pointsExpiryDays ?? 365} days</div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
