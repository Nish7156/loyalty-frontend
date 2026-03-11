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
    <div className="max-w-md mx-auto w-full min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '13px', paddingBottom: '8px' }}>

      {/* Page Title - matching HTML exactly */}
      <div className="a1 px-0.5">
        <p className="text-[11px] uppercase tracking-[0.05em] mb-1" style={{ color: 'var(--user-text-muted)' }}>Overview</p>
        <h1 className="font-syne text-2xl font-black leading-[1.15]" style={{ color: 'var(--user-text-primary)' }}>
          Your Loyalty <span style={{ color: 'var(--accent)' }}>Cards</span>
        </h1>
      </div>

      {/* Tab Switcher - matching HTML exactly */}
      <div
        className="a2 flex p-1 rounded-2xl border"
        style={{
          background: 'var(--user-tabs-bg)',
          borderColor: 'var(--user-tabs-border)',
          gap: '4px'
        }}
      >
        <button
          onClick={() => setActiveTab('wallet')}
          className="flex-1 rounded-xl border-none text-[13px] font-medium cursor-pointer transition-all"
          style={{
            padding: '9px 12px',
            background: activeTab === 'wallet' ? 'rgba(0,212,200,0.14)' : 'transparent',
            color: activeTab === 'wallet' ? 'var(--accent)' : 'var(--user-tab-color)',
            boxShadow: activeTab === 'wallet' ? '0 2px 12px rgba(0,212,200,0.1)' : 'none'
          }}
        >
          👛 Your Wallet
        </button>
        <button
          onClick={() => setActiveTab('stores')}
          className="flex-1 rounded-xl border-none text-[13px] font-medium cursor-pointer transition-all"
          style={{
            padding: '9px 12px',
            background: activeTab === 'stores' ? 'rgba(0,212,200,0.14)' : 'transparent',
            color: activeTab === 'stores' ? 'var(--accent)' : 'var(--user-tab-color)',
            boxShadow: activeTab === 'stores' ? '0 2px 12px rgba(0,212,200,0.1)' : 'none'
          }}
        >
          🏪 Stores You Use
        </button>
      </div>

      {/* Hero Balance Card - matching HTML exactly */}
      <div
        className="a3 relative rounded-[22px] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #00C2B8 0%, #007A8A 55%, #004F66 100%)',
          padding: '24px'
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

        {/* Top row - matching HTML exactly */}
        <div className="flex justify-between items-start">
          <div>
            <span
              className="inline-flex items-center rounded-full text-[10px] font-semibold uppercase tracking-[0.07em]"
              style={{
                gap: '5px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: 'rgba(255,255,255,0.9)',
                padding: '3px 10px'
              }}
            >
              ● Total
            </span>
            <p className="text-xs mt-4 mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>Wallet Balance</p>
            <div className="flex items-baseline" style={{ gap: '6px' }}>
              <span className="font-syne text-[58px] font-black leading-none text-white">{totalPoints.toFixed(0)}</span>
              <span className="text-xl font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>pts</span>
            </div>
          </div>
          <div
            className="flex items-center justify-center text-[26px]"
            style={{
              width: '54px',
              height: '54px',
              background: 'rgba(255,255,255,0.18)',
              borderRadius: '18px',
              backdropFilter: 'blur(8px)'
            }}
          >
            💰
          </div>
        </div>

        {/* Stats - matching HTML exactly */}
        <div className="flex mt-5 relative z-10" style={{ gap: '10px' }}>
          <div
            className="flex-1 rounded-[14px]"
            style={{
              background: 'var(--user-stat-chip-bg)',
              padding: '12px 14px',
              backdropFilter: 'blur(10px)'
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.06em] mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Earned</p>
            <p className="font-syne text-xl font-black text-white">+{totalEarned.toFixed(0)}</p>
          </div>
          <div
            className="flex-1 rounded-[14px]"
            style={{
              background: 'var(--user-stat-chip-bg)',
              padding: '12px 14px',
              backdropFilter: 'blur(10px)'
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.06em] mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Spent</p>
            <p className="font-syne text-xl font-black text-white">-{totalSpent.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'wallet' && wallets.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
          {/* Bento Grid - matching HTML exactly */}
          <div className="a4 grid grid-cols-2" style={{ gap: '13px' }}>
            {wallets.slice(0, 2).map((wallet, idx) => {
              const minRedemption = 100; // Default redemption threshold
              const progress = (wallet.balance / minRedemption) * 100;

              if (idx === 0) {
                // Redeem progress card - matching HTML exactly
                return (
                  <div
                    key={wallet.partnerId}
                    className="glass-card rounded-[22px]"
                  >
                    <div style={{ padding: '18px' }}>
                      <p className="text-[10px] uppercase tracking-[0.07em] mb-2" style={{ color: 'var(--user-text-muted)' }}>Redeem At</p>
                      <p className="font-syne text-[30px] font-black leading-none" style={{ color: 'var(--accent)' }}>{minRedemption}</p>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--user-text-muted)' }}>pts minimum</p>

                      {/* Progress bar - matching HTML exactly */}
                      <div
                        className="rounded-full overflow-hidden mt-2.5"
                        style={{ height: '5px', background: 'var(--user-prog-track)' }}
                      >
                        <div
                          className="h-full rounded-full relative"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            background: 'linear-gradient(90deg, #00D4C8, #00A0A8)'
                          }}
                        >
                          <div
                            className="absolute right-0 top-0 bottom-0 rounded-full"
                            style={{
                              width: '6px',
                              background: 'rgba(255,255,255,0.5)',
                              filter: 'blur(2px)'
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] mt-1.5" style={{ color: 'var(--user-text-subtle)' }}>
                        {wallet.balance.toFixed(0)} of {minRedemption} pts
                      </p>
                    </div>
                  </div>
                );
              } else {
                // Store mini card - matching HTML exactly
                return (
                  <div
                    key={wallet.partnerId}
                    className="glass-card rounded-[22px]"
                  >
                    <div style={{ padding: '18px' }}>
                      <p className="text-[10px] uppercase tracking-[0.07em] mb-2" style={{ color: 'var(--user-text-muted)' }}>Store</p>
                      <p className="font-syne text-xl font-black leading-tight" style={{ color: 'var(--user-text-primary)' }}>{wallet.partnerName}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--user-text-muted)' }}>📍 Branch</p>
                      <span
                        className="inline-flex items-center rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] mt-3.5"
                        style={{
                          gap: '5px',
                          background: 'rgba(0,212,200,0.1)',
                          border: '1px solid rgba(0,212,200,0.22)',
                          color: 'var(--accent)',
                          padding: '4px 11px'
                        }}
                      >
                        ■ Points
                      </span>
                    </div>
                  </div>
                );
              }
            })}
          </div>

          {/* Store Balance Cards - matching HTML exactly */}
          {wallets.map((wallet, idx) => {
            const store = stores.find(s => s.partnerId === wallet.partnerId);

            return (
              <div
                key={wallet.partnerId}
                className={`glass-card rounded-[22px] overflow-hidden ${idx === 0 ? 'a5' : 'a' + (5 + idx)}`}
              >
                <div
                  className="flex justify-between items-center border-b"
                  style={{
                    padding: '18px 18px 14px',
                    borderColor: 'var(--user-store-divider)'
                  }}
                >
                  <div>
                    <p className="font-syne text-base font-black" style={{ color: 'var(--user-text-primary)' }}>{wallet.partnerName}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--user-text-muted)' }}>📍 {store?.branchName || 'Branch'}</p>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{
                      gap: '5px',
                      background: 'rgba(0,212,200,0.1)',
                      border: '1px solid rgba(0,212,200,0.22)',
                      color: 'var(--accent)',
                      padding: '4px 11px'
                    }}
                  >
                    ■ Points
                  </span>
                </div>

                <div className="text-center" style={{ padding: '20px 18px' }}>
                  <p className="text-[10px] uppercase tracking-[0.1em] mb-2.5" style={{ color: 'var(--user-text-muted)' }}>Your Balance</p>
                  <div className="flex items-baseline justify-center" style={{ gap: '6px' }}>
                    <span className="font-syne text-[46px] font-black leading-none" style={{ color: 'var(--accent)' }}>{wallet.balance.toFixed(0)}</span>
                    <span className="text-base font-semibold" style={{ color: 'var(--accent)', opacity: 0.7 }}>Pts</span>
                  </div>
                  <p className="text-xs mt-2.5" style={{ color: 'var(--user-text-muted)' }}>💰 Earn Points On Every Purchase</p>
                </div>
              </div>
            );
          })}

          {/* Earn Banner - matching HTML exactly */}
          <div className="glass-card rounded-[22px] a6">
            <div className="flex items-center" style={{ gap: '14px', padding: '16px 18px' }}>
              <div
                className="flex-shrink-0 flex items-center justify-center text-[22px]"
                style={{
                  width: '46px',
                  height: '46px',
                  background: 'var(--user-earn-icon-bg)',
                  border: '1px solid var(--user-earn-icon-border)',
                  borderRadius: '15px'
                }}
              >
                💳
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: 'var(--user-text-primary)' }}>Earn on Every Purchase</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--user-text-muted)' }}>Points added automatically</p>
              </div>
              <span className="text-[22px] ml-auto" style={{ color: 'var(--accent)', opacity: 0.6 }}>›</span>
            </div>
          </div>

          {/* Minimum Redemption Notice - matching HTML exactly */}
          {wallets.some(w => w.balance < 100) && (
            <div className="glass-card rounded-[22px] a7">
              <div className="flex items-center" style={{ gap: '14px', padding: '16px 18px' }}>
                <div
                  className="flex-shrink-0 flex items-center justify-center text-xl"
                  style={{
                    width: '46px',
                    height: '46px',
                    background: 'var(--user-earn-icon-bg)',
                    border: '1px solid var(--user-earn-icon-border)',
                    borderRadius: '15px'
                  }}
                >
                  🎯
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: 'var(--user-text-primary)' }}>Need {100} Points to Redeem</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--user-text-muted)' }}>
                    You're {Math.max(0, 100 - totalPoints).toFixed(0)} pts away — keep going!
                  </p>
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
