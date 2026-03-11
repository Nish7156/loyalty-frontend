import { useEffect, useState, useRef } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { getCustomerTokenIfPresent, getCustomerPhoneFromToken, customersApi, feedbackApi, walletApi } from '../lib/api';
import { createCustomerSocket } from '../lib/socket';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { PWAInstallButton } from '../components/PWAInstallButton';
import type { WalletBalance } from '../lib/api';

const CHECKIN_UPDATED_EVENT = 'loyalty_checkin_updated';
const MAX_FEEDBACK_LENGTH = 2000;

function getSystemDark(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Centralized customer auth: only show login at / when logged out; once logged in, never ask again on /me, /history, /rewards. */
export function UserLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  const hasToken = !!getCustomerTokenIfPresent();
  const isMe = pathname === '/me';
  const isHistory = pathname === '/history';
  const isRewards = pathname === '/rewards';
  const isRequests = pathname === '/requests';
  const [systemDark, setSystemDark] = useState(getSystemDark);
  const resolvedTheme = systemDark ? 'dark' : 'light';
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [showApprovalCelebration, setShowApprovalCelebration] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([]);
  const celebrationEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const m = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setSystemDark(m.matches);
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, []);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = feedbackMessage.trim();
    if (!text || feedbackSending) return;
    setFeedbackSending(true);
    setFeedbackError('');
    try {
      await feedbackApi.submit(text);
      setFeedbackSent(true);
      setFeedbackMessage('');
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to send. Try again.');
    } finally {
      setFeedbackSending(false);
    }
  };

  const closeFeedbackModal = () => {
    if (feedbackSending) return;
    setFeedbackOpen(false);
    setFeedbackMessage('');
    setFeedbackError('');
    setFeedbackSent(false);
  };

  useEffect(() => {
    if (!hasToken) return;
    const phone = getCustomerPhoneFromToken();
    if (phone) {
      setCustomerPhone(phone);
    }

    // Fetch profile to get name
    customersApi.getMyProfile()
      .then((p) => {
        setCustomerPhone(p.customer.phoneNumber);
        setCustomerName(p.customer.name || null);
      })
      .catch(() => {});

    // Fetch wallet balances
    walletApi.getAllBalances().then(setWalletBalances).catch(() => {});
  }, [hasToken]);

  useEffect(() => {
    if (!customerPhone) return;
    const socket = createCustomerSocket(customerPhone);
    const handler = (payload: { id: string; status: string }) => {
      window.dispatchEvent(new CustomEvent(CHECKIN_UPDATED_EVENT, { detail: payload }));
      if (payload.status === 'APPROVED') {
        if (celebrationEndRef.current) clearTimeout(celebrationEndRef.current);
        setShowApprovalCelebration(true);
        const duration = 2500;
        const end = Date.now() + duration;
        const frame = () => {
          confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#22d3ee', '#2dd4bf', '#fafafa'] });
          confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#22d3ee', '#2dd4bf', '#fafafa'] });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
        celebrationEndRef.current = setTimeout(() => {
          setShowApprovalCelebration(false);
          celebrationEndRef.current = null;
        }, 2200);
        // Refresh wallet balances after approval
        walletApi.getAllBalances().then(setWalletBalances).catch(() => {});
      }
    };
    socket.on('checkin_updated', handler);
    return () => {
      socket.off('checkin_updated', handler);
      socket.disconnect();
      if (celebrationEndRef.current) clearTimeout(celebrationEndRef.current);
    };
  }, [customerPhone]);

  if (!hasToken && pathname !== '/' && pathname !== '/scan' && !pathname.startsWith('/scan/')) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  if (hasToken && pathname === '/') {
    return <Navigate to="/me" replace />;
  }

  return (
    <div className="user-theme flex flex-col min-h-screen min-h-[100dvh] text-[var(--user-text)] safe-area" data-theme={resolvedTheme} style={{ background: 'var(--user-bg)' }}>
      <header className="shrink-0 safe-area-top safe-area-x" style={{ padding: '18px 20px 0' }}>
        <div className="flex items-center justify-between">
          {/* Left: Logo matching HTML exactly */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white font-black text-base"
              style={{ background: 'linear-gradient(135deg, #00D4C8, #007A8A)' }}
            >
              +
            </div>
            <span className="font-syne text-[17px] font-black tracking-[0.01em]" style={{ color: 'var(--user-text-primary)' }}>
              LOYALTY
            </span>
            <span style={{ fontSize: '16px', marginLeft: '-4px' }}>
              {resolvedTheme === 'light' ? '☀️' : '🌙'}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {hasToken && (customerPhone || customerName) && (
              <Link
                to="/profile"
                className="block transition touch-manipulation"
                aria-label="My Profile"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base transition hover:opacity-80"
                  style={{
                    background: 'var(--user-icon-btn-bg)',
                    border: '1px solid var(--user-icon-btn-border)',
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
                    {(customerName || customerPhone || 'U')[0].toUpperCase()}
                  </div>
                </div>
              </Link>
            )}
            {hasToken && walletBalances.length > 0 && (() => {
              const totalPoints = walletBalances.reduce((sum, w) => sum + w.balance, 0);
              return totalPoints > 0 ? (
                <Link
                  to="/wallet"
                  className="flex items-center gap-1.5 transition-all touch-manipulation"
                  style={{
                    background: 'rgba(0, 212, 200, 0.1)',
                    border: '1px solid rgba(0, 212, 200, 0.22)',
                    color: 'var(--accent)',
                    borderRadius: '100px',
                    padding: '7px 13px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <span>💰</span>
                  <span className="whitespace-nowrap">
                    {totalPoints.toFixed(0)} pts
                  </span>
                </Link>
              ) : null;
            })()}
            <PWAInstallButton />
            {hasToken && (
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base cursor-pointer transition hover:opacity-80"
                style={{
                  background: 'var(--user-icon-btn-bg)',
                  border: '1px solid var(--user-icon-btn-border)',
                }}
                aria-label="Feedback"
              >
                💬
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Scrollable main content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 safe-area-x" style={{ padding: '20px 18px 10px' }}>
        <Outlet />
      </main>
      {feedbackOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Feedback">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'var(--user-overlay)' }} aria-hidden="true" onClick={closeFeedbackModal} />
          <div className="relative w-full max-w-sm rounded-2xl border p-4 sm:p-5 shadow-xl animate-scale-in max-h-[90vh] overflow-auto safe-area-x min-w-0" style={{ backgroundColor: 'var(--user-bg)', borderColor: 'var(--user-border-subtle)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--user-text)' }}>Feedback</h2>
              <button type="button" onClick={closeFeedbackModal} disabled={feedbackSending} className="p-2 -m-2 rounded-lg disabled:opacity-50" style={{ color: 'var(--user-text-muted)' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--user-text)'; e.currentTarget.style.backgroundColor = 'var(--user-hover)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--user-text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }} aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {feedbackSent ? (
              <div className="py-2">
                <p className="text-emerald-600 font-medium">Thank you!</p>
                <p className="text-sm mt-1" style={{ color: 'var(--user-text-muted)' }}>Your feedback has been sent.</p>
                <button type="button" onClick={() => setFeedbackSent(false)} className="mt-3 text-sm text-cyan-600 font-medium hover:text-cyan-500">Send another</button>
                <button type="button" onClick={closeFeedbackModal} className="block mt-2 text-sm" style={{ color: 'var(--user-text-muted)' }}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit}>
                <label htmlFor="feedback-modal-message" className="block text-sm font-medium mb-2" style={{ color: 'var(--user-text-muted)' }}>What we can improve</label>
                <textarea
                  id="feedback-modal-message"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value.slice(0, MAX_FEEDBACK_LENGTH))}
                  placeholder="e.g. Faster check-in, better rewards..."
                  className="w-full min-h-[100px] rounded-xl border px-4 py-3 focus:ring-2 focus:ring-cyan-400/40 outline-none transition resize-y"
                  style={{ backgroundColor: 'var(--user-input-bg)', borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}
                  maxLength={MAX_FEEDBACK_LENGTH}
                  rows={3}
                  disabled={feedbackSending}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--user-text-subtle)' }}>{feedbackMessage.length}/{MAX_FEEDBACK_LENGTH}</p>
                {feedbackError && <p className="text-rose-500 text-sm mt-2">{feedbackError}</p>}
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={closeFeedbackModal} disabled={feedbackSending} className="flex-1 min-h-[44px] rounded-xl border text-sm font-medium disabled:opacity-50" style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}>Cancel</button>
                  <button type="submit" disabled={feedbackSending || !feedbackMessage.trim()} className="flex-1 min-h-[44px] rounded-xl bg-cyan-500 text-white text-sm font-semibold hover:bg-cyan-400 disabled:opacity-50 disabled:pointer-events-none">
                    {feedbackSending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {showApprovalCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'var(--user-overlay)' }} aria-live="polite">
          <div className="rounded-2xl border px-8 py-6 text-center shadow-xl animate-scale-in" style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border-subtle)' }}>
            <p className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">Visit approved!</p>
            <p className="text-sm mt-1" style={{ color: 'var(--user-text-muted)' }}>Thanks for checking in.</p>
          </div>
        </div>
      )}
      <PWAInstallPrompt />
      <nav className="fixed bottom-0 left-0 right-0 z-20 backdrop-blur-md border-t flex justify-center items-center gap-1 py-2 px-2 sm:px-1 safe-area-bottom safe-area-x" style={{ backgroundColor: 'var(--user-nav-bg)', borderColor: 'var(--user-border-subtle)' }}>
        {hasToken ? (
          <>
            <Link
              to="/me"
              className={`nav-tab flex flex-col items-center gap-1 py-3 px-4 rounded-2xl min-w-[64px] min-h-[52px] justify-center touch-manipulation md:min-h-0 md:py-2.5 flex-1 max-w-[100px] ${
                isMe ? 'text-cyan-500 ring-1 ring-cyan-500/30' : ''
              }`}
              style={isMe ? { backgroundColor: 'var(--user-hover)' } : { color: 'var(--user-text-subtle)' }}
            >
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wide">Profile</span>
            </Link>
            <Link
              to="/rewards"
              className={`nav-tab flex flex-col items-center gap-1 py-3 px-4 rounded-2xl min-w-[64px] min-h-[52px] justify-center touch-manipulation md:min-h-0 md:py-2.5 flex-1 max-w-[100px] ${
                isRewards ? 'text-cyan-500 ring-1 ring-cyan-500/30' : ''
              }`}
              style={isRewards ? { backgroundColor: 'var(--user-hover)' } : { color: 'var(--user-text-subtle)' }}
            >
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wide">Rewards</span>
            </Link>
            <Link
              to="/requests"
              className={`nav-tab flex flex-col items-center gap-1 py-3 px-4 rounded-2xl min-w-[64px] min-h-[52px] justify-center touch-manipulation md:min-h-0 md:py-2.5 flex-1 max-w-[100px] ${
                isRequests ? 'text-cyan-500 ring-1 ring-cyan-500/30' : ''
              }`}
              style={isRequests ? { backgroundColor: 'var(--user-hover)' } : { color: 'var(--user-text-subtle)' }}
            >
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wide">Requests</span>
            </Link>
            <Link
              to="/history"
              className={`nav-tab flex flex-col items-center gap-1 py-3 px-4 rounded-2xl min-w-[64px] min-h-[52px] justify-center touch-manipulation md:min-h-0 md:py-2.5 flex-1 max-w-[100px] ${
                isHistory ? 'text-cyan-500 ring-1 ring-cyan-500/30' : ''
              }`}
              style={isHistory ? { backgroundColor: 'var(--user-hover)' } : { color: 'var(--user-text-subtle)' }}
            >
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wide">History</span>
            </Link>
          </>
        ) : (
          <>
            <span className="nav-tab flex flex-col items-center gap-1 py-3 px-4 rounded-2xl min-w-[64px] min-h-[52px] justify-center md:min-h-0 md:py-2.5 flex-1 max-w-[100px] cursor-not-allowed pointer-events-none select-none" style={{ color: 'var(--user-text-subtle)', opacity: 0.8 }} aria-disabled="true">
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wide">Profile</span>
            </span>
            <span className="nav-tab flex flex-col items-center gap-1 py-3 px-4 rounded-2xl min-w-[64px] min-h-[52px] justify-center md:min-h-0 md:py-2.5 flex-1 max-w-[100px] cursor-not-allowed pointer-events-none select-none" style={{ color: 'var(--user-text-subtle)', opacity: 0.8 }} aria-disabled="true">
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wide">Rewards</span>
            </span>
            <span className="nav-tab flex flex-col items-center gap-1 py-3 px-4 rounded-2xl min-w-[64px] min-h-[52px] justify-center md:min-h-0 md:py-2.5 flex-1 max-w-[100px] cursor-not-allowed pointer-events-none select-none" style={{ color: 'var(--user-text-subtle)', opacity: 0.8 }} aria-disabled="true">
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wide">Requests</span>
            </span>
            <span className="nav-tab flex flex-col items-center gap-1 py-3 px-4 rounded-2xl min-w-[64px] min-h-[52px] justify-center md:min-h-0 md:py-2.5 flex-1 max-w-[100px] cursor-not-allowed pointer-events-none select-none" style={{ color: 'var(--user-text-subtle)', opacity: 0.8 }} aria-disabled="true">
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wide">History</span>
            </span>
          </>
        )}
      </nav>
    </div>
  );
}
