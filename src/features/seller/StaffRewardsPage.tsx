import { useEffect, useState, useCallback } from 'react';
import { rewardsApi } from '../../lib/api';
import type { Reward } from '../../lib/api';
import { Button } from '../../components/Button';

export function StaffRewardsPage() {
  const [pendingRewards, setPendingRewards] = useState<Reward[]>([]);
  const [codeInput, setCodeInput] = useState('');
  const [completingCode, setCompletingCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPending = useCallback(() => {
    rewardsApi
      .pendingRedemptions()
      .then(setPendingRewards)
      .catch(() => setPendingRewards([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleCompleteByCode = async (code: string) => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setCompletingCode(c);
    setError('');
    try {
      await rewardsApi.completeByCode(c);
      setCodeInput('');
      setPendingRewards((prev) => prev.filter((r) => (r.redemptionCode ?? '').toUpperCase() !== c));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete');
    } finally {
      setCompletingCode(null);
    }
  };

  return (
    <div className="min-w-0">
      <h1 className="text-lg font-bold mb-3 md:text-xl md:mb-4">Rewards</h1>
      <p className="text-gray-500 text-sm mb-4">When a customer shows their reward code, enter it below and mark complete.</p>

      <div className="bg-white rounded-xl shadow border border-gray-100 p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Enter redemption code</label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 8))}
            placeholder="e.g. ABC12XYZ"
            className="min-h-[44px] w-36 rounded-lg border border-gray-300 px-3 font-mono uppercase text-lg"
            maxLength={8}
          />
          <Button
            onClick={() => handleCompleteByCode(codeInput)}
            disabled={!codeInput.trim() || completingCode !== null}
            className="min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          >
            {completingCode ? 'Completing…' : 'Mark complete'}
          </Button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      <h2 className="text-base font-bold mb-2">Pending at your store</h2>
      <p className="text-gray-500 text-sm mb-3">Or tap Mark complete on a pending redemption below.</p>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : pendingRewards.length === 0 ? (
        <p className="text-gray-500 text-sm">No pending reward redemptions.</p>
      ) : (
        <ul className="space-y-3">
          {pendingRewards.map((r) => {
            const code = r.redemptionCode ?? '';
            const isCompleting = completingCode === code;
            return (
              <li key={r.id} className="bg-white rounded-xl shadow border border-gray-100 p-4 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono font-semibold text-gray-900">{code}</p>
                  {r.customer?.name && <p className="text-gray-600 text-sm">{r.customer.name}</p>}
                  <p className="text-gray-500 text-xs mt-0.5">{r.partner?.businessName}</p>
                </div>
                <Button
                  onClick={() => handleCompleteByCode(code)}
                  disabled={isCompleting}
                  className="min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium shrink-0"
                >
                  {isCompleting ? '…' : 'Mark complete'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
