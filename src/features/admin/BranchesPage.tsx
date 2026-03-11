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

      // Fetch full details
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
      // Reload branches for this partner
      await loadBranches(partnerId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update lock status');
    }
  };

  if (loading) return <p className="text-sm md:text-base p-2">Loading stores…</p>;

  return (
    <div className="min-w-0">
      <div className="mb-4">
        <h1 className="text-lg font-bold mb-1 md:text-2xl">Branch Lock Control</h1>
        <p className="text-sm text-gray-600">Click on a store to manage branch settings locks</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {partners.length === 0 ? (
        <p className="text-gray-500">No stores found.</p>
      ) : (
        <div className="space-y-3">
          {partners.map((partner) => {
            const isExpanded = expandedPartnerId === partner.id;
            const branches = partner.branches || [];
            const isLoadingBranches = loadingBranches[partner.id];

            return (
              <div key={partner.id} className="bg-white rounded-lg shadow border border-gray-200">
                {/* Store Header - Clickable */}
                <button
                  onClick={() => togglePartner(partner.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg text-gray-900">{partner.businessName}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {partner.industryType} • {branches.length > 0 ? `${branches.length} branches` : 'Click to load branches'}
                    </p>
                  </div>
                  <div className="text-2xl text-gray-400">
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </button>

                {/* Branches List - Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {isLoadingBranches && (
                      <p className="text-sm text-gray-500">Loading branches...</p>
                    )}

                    {!isLoadingBranches && branches.length === 0 && (
                      <p className="text-sm text-gray-500">No branches for this store.</p>
                    )}

                    {!isLoadingBranches && branches.length > 0 && (
                      <div className="space-y-3">
                        {branches.map((branch) => {
                          const loyaltyType = branch.loyaltyType ?? 'VISITS';
                          const isLocked = branch.settingsLocked ?? false;

                          return (
                            <div
                              key={branch.id}
                              className="bg-white rounded-lg border border-gray-200 p-4"
                            >
                              <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <h3 className="font-semibold text-base text-gray-900">
                                      {branch.branchName}
                                    </h3>

                                    {loyaltyType === 'VISITS' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                        🎫 Visit-Based
                                      </span>
                                    )}
                                    {loyaltyType === 'POINTS' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        💰 Points-Based
                                      </span>
                                    )}
                                    {loyaltyType === 'HYBRID' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                        🔄 Hybrid
                                      </span>
                                    )}

                                    {isLocked ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                        🔒 Locked
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                        🔓 Unlocked
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-xs text-gray-500">ID: {branch.id}</p>
                                </div>

                                <div className="shrink-0">
                                  {isLocked ? (
                                    <Button
                                      variant="secondary"
                                      className="min-h-[40px] text-sm"
                                      onClick={() => toggleLock(branch.id, isLocked, partner.id)}
                                    >
                                      🔓 Unlock
                                    </Button>
                                  ) : (
                                    <Button
                                      className="min-h-[40px] text-sm bg-red-600 hover:bg-red-700"
                                      onClick={() => toggleLock(branch.id, isLocked, partner.id)}
                                    >
                                      🔒 Lock
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Settings Preview */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
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
