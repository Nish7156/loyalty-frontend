import { useEffect, useState } from 'react';
import { walletApi, customersApi } from '../../lib/api';
import { HistorySkeleton } from '../../components/Skeleton';
import type { WalletBalance, CustomerProfile } from '../../lib/api';

export function UserWalletPage() {
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'wallet' | 'stores'>('wallet');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      walletApi.getAllBalances(),
      customersApi.getMyProfile(),
    ])
      .then(([walletData, profileData]) => {
        setWallets(walletData);
        setProfile(profileData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load wallet'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0">
        <HistorySkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto w-full min-w-0 py-8">
        <h1 className="text-xl font-bold mb-4 user-text">💰 Wallet</h1>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-rose-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const totalPoints = wallets.reduce((sum, w) => sum + w.balance, 0);
  const totalEarned = wallets.reduce((sum, w) => sum + w.lifetimeEarned, 0);
  const totalSpent = wallets.reduce((sum, w) => sum + w.lifetimeSpent, 0);

  // Get stores from profile
  const stores = profile?.storesVisited || [];

  return (
    <div className="max-w-md mx-auto space-y-4 pb-8 w-full min-w-0">

      {/* Page Title */}
      <div className="opacity-0 animate-fade-in-up">
        <p className="text-[10px] user-text-muted uppercase tracking-[0.05em] mb-1">Overview</p>
        <h1 className="text-2xl font-black user-text leading-tight">
          Your Loyalty <span className="text-cyan-500">Cards</span>
        </h1>
      </div>

      {/* Tab Switcher */}
      <div
        className="flex gap-1 p-1 rounded-2xl border opacity-0 animate-fade-in-up"
        style={{
          background: 'var(--user-surface)',
          borderColor: 'var(--user-border-subtle)',
          animationDelay: '0.1s'
        }}
      >
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-[13px] font-medium transition-all ${
            activeTab === 'wallet'
              ? 'bg-cyan-500/10 text-cyan-500 shadow-sm'
              : 'text-[var(--user-text-muted)]'
          }`}
        >
          👛 Your Wallet
        </button>
        <button
          onClick={() => setActiveTab('stores')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-[13px] font-medium transition-all ${
            activeTab === 'stores'
              ? 'bg-cyan-500/10 text-cyan-500 shadow-sm'
              : 'text-[var(--user-text-muted)]'
          }`}
        >
          🏪 Stores You Use
        </button>
      </div>

      {/* Hero Balance Card */}
      <div
        className="relative rounded-[22px] p-6 overflow-hidden opacity-0 animate-scale-in"
        style={{
          background: 'linear-gradient(135deg, #00C2B8 0%, #007A8A 55%, #004F66 100%)',
          animationDelay: '0.2s'
        }}
      >
        {/* Decorative gradients */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-40%',
            right: '-15%',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)'
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-35%',
            left: '-10%',
            width: '220px',
            height: '220px',
            background: 'radial-gradient(circle, rgba(0,0,0,0.22) 0%, transparent 70%)'
          }}
        />

        {/* Top row */}
        <div className="flex justify-between items-start relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-black/20 border border-white/20 text-white/90 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
              ● Total Balance
            </span>
            <p className="text-white/75 text-xs mt-4 mb-1">Wallet Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[58px] font-black text-white leading-none">{totalPoints.toFixed(0)}</span>
              <span className="text-xl font-semibold text-white/80">pts</span>
            </div>
          </div>
          <div
            className="w-[54px] h-[54px] bg-white/20 rounded-[18px] flex items-center justify-center text-[26px] backdrop-blur-sm"
          >
            💰
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2.5 mt-5 relative z-10">
          <div className="flex-1 bg-black/20 rounded-[14px] p-3 backdrop-blur-sm">
            <p className="text-[10px] text-white/65 uppercase tracking-wider mb-1">Earned</p>
            <p className="text-xl font-black text-white">+{totalEarned.toFixed(0)}</p>
          </div>
          <div className="flex-1 bg-black/20 rounded-[14px] p-3 backdrop-blur-sm">
            <p className="text-[10px] text-white/65 uppercase tracking-wider mb-1">Spent</p>
            <p className="text-xl font-black text-white">-{totalSpent.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'wallet' && wallets.length > 0 && (
        <div className="space-y-3">
          {/* Bento Grid */}
          <div className="grid grid-cols-2 gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.28s' }}>
            {wallets.slice(0, 2).map((wallet, idx) => {
              const minRedemption = 100; // Default redemption threshold
              const progress = (wallet.balance / minRedemption) * 100;

              if (idx === 0) {
                // Redeem progress card
                return (
                  <div
                    key={wallet.partnerId}
                    className="glass-card rounded-[22px] p-4 hover-lift relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    <p className="text-[10px] user-text-muted uppercase tracking-wider mb-2">Redeem At</p>
                    <p className="text-[30px] font-black text-cyan-500 leading-none">{minRedemption}</p>
                    <p className="text-[11px] user-text-muted mt-1">pts minimum</p>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-white/10 dark:bg-white/10 rounded-full overflow-hidden mt-2.5">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full relative"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      >
                        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/50 rounded-full blur-[2px]" />
                      </div>
                    </div>
                    <p className="text-[10px] user-text-subtle mt-1.5">
                      {wallet.balance.toFixed(0)} of {minRedemption} pts
                    </p>
                  </div>
                );
              } else {
                // Store mini card
                return (
                  <div
                    key={wallet.partnerId}
                    className="glass-card rounded-[22px] p-4 hover-lift relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    <p className="text-[10px] user-text-muted uppercase tracking-wider mb-2">Store</p>
                    <p className="text-xl font-black user-text leading-tight">{wallet.partnerName}</p>
                    <p className="text-xs user-text-muted mt-1">📍 {wallet.balance.toFixed(0)} pts</p>
                    <span className="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider mt-3">
                      ■ Points
                    </span>
                  </div>
                );
              }
            })}
          </div>

          {/* Store Balance Cards */}
          {wallets.map((wallet, idx) => {
            const store = stores.find(s => s.partnerId === wallet.partnerId);

            return (
              <div
                key={wallet.partnerId}
                className="glass-card rounded-[22px] overflow-hidden hover-lift opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${0.35 + idx * 0.07}s` }}
              >
                <div
                  className="px-4 py-3.5 border-b flex justify-between items-center"
                  style={{ borderColor: 'var(--user-border-subtle)' }}
                >
                  <div>
                    <p className="text-base font-black user-text">{wallet.partnerName}</p>
                    <p className="text-xs user-text-muted mt-0.5">📍 {store?.branchName || 'Branch'}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                    ■ Points
                  </span>
                </div>

                <div className="p-5 text-center">
                  <p className="text-[10px] user-text-muted uppercase tracking-[0.1em] mb-2.5">Your Balance</p>
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-[46px] font-black text-cyan-500 leading-none">{wallet.balance.toFixed(0)}</span>
                    <span className="text-base font-semibold text-cyan-500/70">Pts</span>
                  </div>
                  <p className="text-xs user-text-muted mt-2.5">💰 Earn Points On Every Purchase</p>
                </div>
              </div>
            );
          })}

          {/* Earn Banner */}
          <div
            className="glass-card rounded-[22px] hover-lift opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${0.42 + wallets.length * 0.07}s` }}
          >
            <div className="flex items-center gap-3.5 p-4">
              <div
                className="w-[46px] h-[46px] flex-shrink-0 bg-cyan-500/10 border border-cyan-500/20 rounded-[15px] flex items-center justify-center text-[22px]"
              >
                💳
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm user-text">Earn on Every Purchase</p>
                <p className="text-xs user-text-muted mt-0.5">Points added automatically</p>
              </div>
              <span className="text-[22px] text-cyan-500 opacity-60">›</span>
            </div>
          </div>

          {/* Minimum Redemption Notice */}
          {wallets.some(w => w.balance < 100) && (
            <div
              className="glass-card rounded-[22px] hover-lift opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${0.48 + wallets.length * 0.07}s` }}
            >
              <div className="flex items-center gap-3.5 p-4">
                <div
                  className="w-[46px] h-[46px] flex-shrink-0 bg-amber-500/10 border border-amber-500/20 rounded-[15px] flex items-center justify-center text-xl"
                >
                  🎯
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm user-text">Keep Earning Points</p>
                  <p className="text-xs user-text-muted mt-0.5">Redeem when you reach minimum balance</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stores' && (
        <div className="space-y-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {stores.length === 0 ? (
            <div className="glass-card rounded-[22px] p-6 text-center">
              <p className="user-text-muted text-sm">No stores visited yet. Scan a QR code at a store to get started!</p>
            </div>
          ) : (
            stores.map((store, idx) => (
              <div
                key={store.partnerId}
                className="glass-card rounded-[22px] p-5 hover-lift"
                style={{ animationDelay: `${0.28 + idx * 0.07}s` }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-black user-text truncate">{store.partnerName}</p>
                    <p className="text-xs user-text-muted mt-1">📍 {store.branchName}</p>
                    <p className="text-xs user-text-muted mt-0.5">
                      {store.visitCount} visit{store.visitCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                    store.loyaltyType === 'POINTS' || store.loyaltyType === 'HYBRID'
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-500'
                      : 'bg-purple-500/10 border border-purple-500/20 text-purple-500'
                  }`}>
                    {store.loyaltyType === 'POINTS' ? '■ Points' : store.loyaltyType === 'HYBRID' ? '🔄 Hybrid' : '📍 Visits'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {wallets.length === 0 && (
        <div className="glass-card rounded-[22px] p-6 text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-5xl mb-3">💰</div>
          <p className="font-semibold user-text mb-2">No Wallet Yet</p>
          <p className="user-text-muted text-sm">Visit stores with points-based loyalty to start earning!</p>
        </div>
      )}
    </div>
  );
}
