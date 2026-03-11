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
  const [successMessage, setSuccessMessage] = useState('');

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
    setSuccessMessage('');
    try {
      await rewardsApi.completeByCode(c);
      setCodeInput('');
      setPendingRewards((prev) => prev.filter((r) => (r.redemptionCode ?? '').toUpperCase() !== c));
      setSuccessMessage(`Reward ${c} completed successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete');
    } finally {
      setCompletingCode(null);
    }
  };

  return (
    <div className="min-w-0 max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reward Redemptions</h1>
        <p className="text-gray-600">Process customer reward redemptions by entering their code</p>
      </div>

      {/* Code Entry Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/50 rounded-2xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-2xl">
            🎁
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quick Redemption</h2>
            <p className="text-sm text-gray-600">Enter the customer's 8-character reward code</p>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 8))}
              placeholder="ABC12XYZ"
              className="w-full min-h-[56px] rounded-xl border-2 border-gray-300 px-4 font-mono uppercase text-2xl tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={8}
            />
            <p className="text-xs text-gray-500 mt-2 text-center">Customer will show this code on their device</p>
          </div>
          <Button
            onClick={() => handleCompleteByCode(codeInput)}
            disabled={!codeInput.trim() || completingCode !== null}
            className="min-h-[56px] px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-lg"
          >
            {completingCode ? 'Processing...' : '✓ Complete Redemption'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium">
            ✓ {successMessage}
          </div>
        )}
      </div>

      {/* Pending Rewards Section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Pending Redemptions</h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
          {pendingRewards.length} {pendingRewards.length === 1 ? 'reward' : 'rewards'}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-500">Loading rewards...</p>
        </div>
      ) : pendingRewards.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-gray-500 text-lg font-medium mb-2">All rewards processed!</p>
          <p className="text-gray-400 text-sm">No pending reward redemptions at the moment</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingRewards.map((r) => {
            const code = r.redemptionCode ?? '';
            const isCompleting = completingCode === code;
            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {r.customer?.name ? r.customer.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-mono font-bold text-xl rounded-lg tracking-wider">
                            {code}
                          </span>
                        </div>
                        {r.customer?.name && (
                          <p className="text-base font-semibold text-gray-900">{r.customer.name}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">{r.partner?.businessName}</p>
                        {r.customer?.phoneNumber && (
                          <p className="text-xs text-gray-500 font-mono mt-1">{r.customer.phoneNumber}</p>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleCompleteByCode(code)}
                      disabled={isCompleting}
                      className="min-h-[52px] px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shrink-0"
                    >
                      {isCompleting ? 'Processing...' : '✓ Mark Complete'}
                    </Button>
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
