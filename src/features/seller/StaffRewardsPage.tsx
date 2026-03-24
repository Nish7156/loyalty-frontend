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
    <div className="min-w-0 max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24" style={{ background: '#FAF9F6' }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#5D4037' }}>Reward Redemptions</h1>
        <p style={{ color: '#7B5E54' }}>Process customer reward redemptions by entering their code</p>
      </div>

      {/* Code Entry Card */}
      <div className="rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8" style={{ background: '#FAECE7', border: '1px solid #F5C4B3', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(216,90,48,0.1)' }}>
            <span className="material-symbols-rounded" style={{ color: '#D85A30', fontSize: '28px' }}>redeem</span>
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#5D4037' }}>Quick Redemption</h2>
            <p className="text-sm" style={{ color: '#7B5E54' }}>Enter the customer's 8-character reward code</p>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 8))}
              placeholder="ABC12XYZ"
              className="w-full min-h-[56px] rounded-xl px-4 font-mono uppercase text-2xl tracking-wider text-center focus:outline-none focus:ring-2"
              style={{ border: '2px solid #F5C4B3', color: '#5D4037', background: '#FFF' }}
              maxLength={8}
            />
            <p className="text-xs mt-2 text-center" style={{ color: '#A08880' }}>Customer will show this code on their device</p>
          </div>
          <Button
            onClick={() => handleCompleteByCode(codeInput)}
            disabled={!codeInput.trim() || completingCode !== null}
            className="min-h-[56px] px-8 font-semibold text-lg"
            style={{ background: '#2A6040', color: '#FFF' }}
          >
            <span className="material-symbols-rounded mr-1" style={{ fontSize: '20px' }}>check</span>
            {completingCode ? 'Processing...' : 'Complete Redemption'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg text-sm" style={{ background: '#FDEEE9', border: '1px solid rgba(176,58,42,0.2)', color: '#B03A2A' }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-4 rounded-lg text-sm font-medium" style={{ background: '#E4F2EB', border: '1px solid rgba(42,96,64,0.2)', color: '#2A6040' }}>
            <span className="material-symbols-rounded mr-1" style={{ fontSize: '16px', verticalAlign: 'text-bottom' }}>check_circle</span>
            {successMessage}
          </div>
        )}
      </div>

      {/* Pending Rewards Section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#5D4037' }}>Pending Redemptions</h2>
        <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ background: '#FAECE7', color: '#D85A30' }}>
          {pendingRewards.length} {pendingRewards.length === 1 ? 'reward' : 'rewards'}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-12 rounded-xl" style={{ background: '#FFF', border: '1px solid #FAECE7' }}>
          <p style={{ color: '#7B5E54' }}>Loading rewards...</p>
        </div>
      ) : pendingRewards.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={{ background: '#FFF', border: '1px solid #FAECE7' }}>
          <span className="material-symbols-rounded" style={{ fontSize: '64px', color: '#2A6040' }}>celebration</span>
          <p className="text-lg font-medium mb-2" style={{ color: '#7B5E54' }}>All rewards processed!</p>
          <p className="text-sm" style={{ color: '#A08880' }}>No pending reward redemptions at the moment</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingRewards.map((r) => {
            const code = r.redemptionCode ?? '';
            const isCompleting = completingCode === code;
            return (
              <div key={r.id} className="rounded-xl overflow-hidden transition-shadow hover:shadow-md" style={{ background: '#FFF', border: '1px solid #FAECE7', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: 'linear-gradient(135deg, #D85A30, #E8784E)' }}>
                        {r.customer?.name ? r.customer.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-4 py-2 font-mono font-bold text-xl rounded-lg tracking-wider" style={{ background: '#D85A30', color: '#FFF' }}>
                            {code}
                          </span>
                        </div>
                        {r.customer?.name && (
                          <p className="text-base font-semibold" style={{ color: '#5D4037' }}>{r.customer.name}</p>
                        )}
                        <p className="text-sm mt-1" style={{ color: '#7B5E54' }}>{r.partner?.businessName}</p>
                        {r.customer?.phoneNumber && (
                          <p className="text-xs font-mono mt-1" style={{ color: '#A08880' }}>{r.customer.phoneNumber}</p>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleCompleteByCode(code)}
                      disabled={isCompleting}
                      className="min-h-[52px] px-8 font-semibold shrink-0"
                      style={{ background: '#2A6040', color: '#FFF' }}
                    >
                      <span className="material-symbols-rounded mr-1" style={{ fontSize: '18px' }}>check</span>
                      {isCompleting ? 'Processing...' : 'Mark Complete'}
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
