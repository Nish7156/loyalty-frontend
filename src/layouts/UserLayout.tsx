import { useEffect, useState, useRef } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { getCustomerTokenIfPresent, getCustomerPhoneFromToken, customersApi, feedbackApi, referralsApi } from '../lib/api';
import { REFERRAL_CODE_KEY } from '../App';
import { createCustomerSocket } from '../lib/socket';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { NotificationPermissionBanner } from '../components/NotificationPermissionBanner';
import { PushToastContainer, showPushToast } from '../components/PushToast';

const CHECKIN_UPDATED_EVENT = 'loyalty_checkin_updated';
const MAX_FEEDBACK_LENGTH = 2000;

/** Centralized customer auth: only show login at / when logged out; once logged in, never ask again on /me, /history, /rewards. */
export function UserLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  const hasToken = !!getCustomerTokenIfPresent();
  const isMe = pathname === '/me';
  const isRewards = pathname === '/rewards';
  const isScan = pathname === '/scan' || pathname.startsWith('/scan/');
  const isRequests = pathname === '/requests';
  const isProfile = pathname === '/profile' || pathname === '/account';
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [showApprovalCelebration, setShowApprovalCelebration] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const celebrationEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (phone) setCustomerPhone(phone);
    customersApi.getMyProfile()
      .then((p) => {
        setCustomerPhone(p.customer.phoneNumber);
        if (p.customer.name) setCustomerName(p.customer.name);
        // Apply any pending referral code (stored by index.html IIFE before React mounted)
        const ref = localStorage.getItem(REFERRAL_CODE_KEY);
        if (ref) {
          referralsApi.apply(ref, p.customer.phoneNumber).catch(() => {});
          localStorage.removeItem(REFERRAL_CODE_KEY);
        }
      })
      .catch(() => {});
  }, [hasToken]);

  useEffect(() => {
    if (!customerPhone) return;
    const socket = createCustomerSocket(customerPhone);
    const handler = (payload: { id: string; status: string; branchName?: string; partnerName?: string }) => {
      window.dispatchEvent(new CustomEvent(CHECKIN_UPDATED_EVENT, { detail: payload }));
      if (payload.status === 'APPROVED') {
        showPushToast({
          title: 'Check-in approved!',
          body: payload.branchName ? `Your visit at ${payload.branchName} was approved.` : 'Your visit was approved. Keep going!',
          type: 'CHECKIN_APPROVED',
          url: '/history',
        });
        if (celebrationEndRef.current) clearTimeout(celebrationEndRef.current);
        setShowApprovalCelebration(true);
        const duration = 2500;
        const end = Date.now() + duration;
        const frame = () => {
          confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#D85A30', '#2A6040', '#A8D4BA'] });
          confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#D85A30', '#2A6040', '#E4F2EB'] });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
        celebrationEndRef.current = setTimeout(() => {
          setShowApprovalCelebration(false);
          celebrationEndRef.current = null;
        }, 2200);
      }
    };
    socket.on('checkin_updated', handler);
    socket.on('platform_wallet_updated', (payload: { balance: number; reason: string }) => {
      window.dispatchEvent(new CustomEvent('loyalty_platform_updated', { detail: payload }));
    });
    return () => {
      socket.off('checkin_updated', handler);
      socket.off('platform_wallet_updated');
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

  const navItemStyle = (active: boolean) => ({
    color: active ? 'var(--a)' : 'var(--t3)',
  });

  return (
    <div className="user-theme flex flex-col min-h-screen min-h-[100dvh] safe-area" style={{ background: 'var(--bg)', color: 'var(--t)' }}>
      {/* Header - warm style matching wireframe 03 */}
      <header
        className="fixed top-0 left-0 right-0 z-30 safe-area-top safe-area-x"
        style={{
          padding: '14px 14px',
          backgroundColor: 'var(--s)',
          borderBottom: '1px solid var(--bdl)',
        }}
      >
        <div className="max-w-md mx-auto w-full min-w-0 flex items-center justify-between">
          {/* Left: Wordmark */}
          <Link
            to="/me"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--t)',
              textDecoration: 'none',
            }}
          >
            Loyalty
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
            {hasToken && (
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                className="flex items-center justify-center cursor-pointer transition"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'var(--bdl)',
                  border: '1.5px solid var(--bd)',
                  color: 'var(--a)',
                }}
                aria-label="Feedback"
              >
                <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>chat</span>
              </button>
            )}
            {hasToken && (
              <Link
                to="/account"
                className="flex items-center justify-center"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: customerName ? 'var(--a)' : 'var(--bdl)',
                  border: customerName ? 'none' : '2px solid var(--bd)',
                  color: customerName ? 'var(--s)' : 'var(--a)',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                {customerName ? customerName.charAt(0).toUpperCase() : <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>person</span>}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Scrollable main content */}
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden safe-area-x"
        style={{
          paddingTop: 'calc(62px + env(safe-area-inset-top, 0px))',
          paddingLeft: '12px',
          paddingRight: '12px',
          paddingBottom: 'calc(94px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="max-w-md mx-auto w-full min-w-0">
          <Outlet />
        </div>
      </main>

      {/* Feedback Modal */}
      {feedbackOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4"
          role="dialog" aria-modal="true" aria-label="Feedback"
          style={{ animation: 'feedback-backdrop-in 0.22s ease both' }}
        >
          <style>{`
            @keyframes feedback-backdrop-in {
              from { opacity: 0 }
              to   { opacity: 1 }
            }
            @keyframes feedback-sheet-in {
              from { opacity: 0; transform: translateY(32px) scale(0.97) }
              to   { opacity: 1; transform: translateY(0)    scale(1)    }
            }
            @keyframes feedback-success-pop {
              0%   { opacity: 0; transform: scale(0.6) }
              65%  { transform: scale(1.12) }
              100% { opacity: 1; transform: scale(1) }
            }
            @keyframes feedback-check-draw {
              from { stroke-dashoffset: 40 }
              to   { stroke-dashoffset: 0  }
            }
            @keyframes feedback-text-up {
              from { opacity: 0; transform: translateY(10px) }
              to   { opacity: 1; transform: translateY(0) }
            }
            @keyframes feedback-bar-fill {
              from { width: 0% }
            }
            @keyframes feedback-send-pulse {
              0%   { box-shadow: 0 0 0 0   rgba(216,90,48,0.5) }
              70%  { box-shadow: 0 0 0 10px rgba(216,90,48,0)   }
              100% { box-shadow: 0 0 0 0   rgba(216,90,48,0)   }
            }
          `}</style>

          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: 'var(--user-overlay)' }}
            aria-hidden="true"
            onClick={closeFeedbackModal}
          />

          {/* Sheet */}
          <div
            className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border p-5 shadow-2xl max-h-[92vh] overflow-auto safe-area-x min-w-0"
            style={{
              backgroundColor: 'var(--s)',
              borderColor: 'var(--bdl)',
              animation: 'feedback-sheet-in 0.28s cubic-bezier(.16,1,.3,1) both',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle (mobile) */}
            <div className="flex justify-center mb-4 sm:hidden">
              <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--bdl)' }} />
            </div>

            {feedbackSent ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center py-4 gap-3" style={{ animation: 'feedback-text-up 0.35s ease both' }}>
                {/* Animated check circle */}
                <div
                  style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'var(--grbg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'feedback-success-pop 0.45s cubic-bezier(.16,1,.3,1) both',
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <polyline
                      points="7,16 13,22 25,10"
                      stroke="var(--gr)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="40" strokeDashoffset="40"
                      style={{ animation: 'feedback-check-draw 0.4s ease 0.2s both' }}
                    />
                  </svg>
                </div>

                <div className="text-center" style={{ animation: 'feedback-text-up 0.35s ease 0.15s both', opacity: 0 }}>
                  <p className="text-lg font-bold" style={{ color: 'var(--t)' }}>Thank you!</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>Your feedback helps us improve.</p>
                </div>

                <div className="flex gap-2 w-full mt-2" style={{ animation: 'feedback-text-up 0.35s ease 0.25s both', opacity: 0 }}>
                  <button
                    type="button"
                    onClick={() => setFeedbackSent(false)}
                    className="flex-1 min-h-[44px] rounded-xl border text-sm font-medium transition-all active:scale-95"
                    style={{ borderColor: 'var(--bd)', color: 'var(--t2)' }}
                  >
                    Send another
                  </button>
                  <button
                    type="button"
                    onClick={closeFeedbackModal}
                    className="flex-1 min-h-[44px] rounded-xl text-sm font-semibold transition-all active:scale-95"
                    style={{ background: 'var(--a)', color: '#fff' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* ── Form state ── */
              <form onSubmit={handleFeedbackSubmit}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4" style={{ animation: 'feedback-text-up 0.3s ease 0.05s both', opacity: 0 }}>
                  <div>
                    <h2 className="text-lg font-bold leading-tight" style={{ color: 'var(--t)' }}>Share feedback</h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>We read every message</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeFeedbackModal}
                    disabled={feedbackSending}
                    className="p-2 -mt-1 -mr-1 rounded-xl transition-all active:scale-90 disabled:opacity-40"
                    style={{ color: 'var(--t3)', background: 'var(--bdl)' }}
                    aria-label="Close"
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
                  </button>
                </div>

                {/* Textarea */}
                <div style={{ animation: 'feedback-text-up 0.3s ease 0.12s both', opacity: 0 }}>
                  <textarea
                    id="feedback-modal-message"
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value.slice(0, MAX_FEEDBACK_LENGTH))}
                    placeholder="What could be better? Any ideas welcome…"
                    className="w-full min-h-[120px] rounded-2xl border-2 px-4 py-3 outline-none transition-all resize-none text-sm"
                    style={{
                      backgroundColor: 'var(--bg)',
                      borderColor: feedbackMessage ? 'var(--a)' : 'var(--bd)',
                      color: 'var(--t)',
                      boxShadow: feedbackMessage ? '0 0 0 3px var(--abg)' : 'none',
                    }}
                    maxLength={MAX_FEEDBACK_LENGTH}
                    rows={4}
                    disabled={feedbackSending}
                    autoFocus
                  />

                  {/* Character bar */}
                  <div style={{ marginTop: 6, height: 3, borderRadius: 99, background: 'var(--bdl)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%', borderRadius: 99,
                        width: `${(feedbackMessage.length / MAX_FEEDBACK_LENGTH) * 100}%`,
                        background: feedbackMessage.length > MAX_FEEDBACK_LENGTH * 0.9 ? 'var(--re)' : 'var(--a)',
                        transition: 'width 0.15s ease, background 0.3s ease',
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1 text-right" style={{ color: 'var(--t3)' }}>
                    {feedbackMessage.length}/{MAX_FEEDBACK_LENGTH}
                  </p>
                </div>

                {feedbackError && (
                  <div
                    className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--rebg)', color: 'var(--re)', animation: 'feedback-text-up 0.2s ease both' }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 15 }}>error</span>
                    {feedbackError}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2 mt-4" style={{ animation: 'feedback-text-up 0.3s ease 0.18s both', opacity: 0 }}>
                  <button
                    type="button"
                    onClick={closeFeedbackModal}
                    disabled={feedbackSending}
                    className="flex-1 min-h-[44px] rounded-xl border text-sm font-medium transition-all active:scale-95 disabled:opacity-40"
                    style={{ borderColor: 'var(--bd)', color: 'var(--t2)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={feedbackSending || !feedbackMessage.trim()}
                    className="flex-1 min-h-[50px] rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                    style={{
                      background: 'var(--a)', color: '#fff',
                      animation: feedbackMessage.trim() && !feedbackSending ? 'feedback-send-pulse 1.8s ease 0.6s infinite' : 'none',
                    }}
                  >
                    {feedbackSending ? (
                      <>
                        <span className="material-symbols-rounded animate-spin" style={{ fontSize: 17 }}>progress_activity</span>
                        Sending…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-rounded" style={{ fontSize: 17 }}>send</span>
                        Send
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Approval Celebration */}
      {showApprovalCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'var(--user-overlay)' }} aria-live="polite">
          <div className="rounded-2xl border px-8 py-6 text-center shadow-xl animate-scale-in" style={{ backgroundColor: 'var(--s)', borderColor: 'var(--bdl)' }}>
            <div className="flex items-center justify-center mb-3" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--grbg)', margin: '0 auto' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '32px', color: 'var(--gr)' }}>check_circle</span>
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--gr)' }}>Check-in approved!</p>
            <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>Thanks for checking in.</p>
          </div>
        </div>
      )}

      <PWAInstallPrompt />
      <PushToastContainer />
      <NotificationPermissionBanner />

      {/* Bottom Navigation - matching wireframe 03 exactly */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 safe-area-bottom"
        style={{
          backgroundColor: 'var(--s)',
          borderTop: '1px solid var(--bdl)',
          padding: '0 8px 14px',
          height: '80px',
        }}
      >
        <div className="flex justify-around items-center w-full max-w-md mx-auto h-full">
          {hasToken ? (
            <>
              {/* Cards */}
              <Link to="/me" className="nav-tab flex flex-col items-center gap-0.5 touch-manipulation" title="Cards">
                <span
                  className="flex items-center justify-center transition-all"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isMe ? 'rgba(216,90,48,0.12)' : 'transparent',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '22px', ...navItemStyle(isMe) }}>loyalty</span>
                </span>
                <span className="text-[10px] font-semibold" style={navItemStyle(isMe)}>Cards</span>
              </Link>

              {/* Wallet */}
              <Link to="/rewards" className="nav-tab flex flex-col items-center gap-0.5 touch-manipulation" title="Rewards">
                <span
                  className="flex items-center justify-center transition-all"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isRewards ? 'rgba(216,90,48,0.12)' : 'transparent',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '22px', ...navItemStyle(isRewards) }}>account_balance_wallet</span>
                </span>
                <span className="text-[10px] font-semibold" style={navItemStyle(isRewards)}>Wallet</span>
              </Link>

              {/* Scan Button (center, prominent) */}
              <Link to="/scan" className="nav-tab flex flex-col items-center gap-0.5 touch-manipulation relative" title="Scan">
                <span
                  className="flex items-center justify-center scan-btn-breath"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--a)',
                    color: 'var(--s)',
                    boxShadow: isScan ? '0 4px 14px rgba(216,90,48,0.4)' : '0 3px 10px rgba(216,90,48,0.28)',
                    marginTop: '-12px',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>qr_code_scanner</span>
                </span>
                <span className="text-[10px] font-semibold" style={navItemStyle(isScan)}>Scan</span>
              </Link>

              {/* Requests */}
              <Link to="/requests" className="nav-tab flex flex-col items-center gap-0.5 touch-manipulation relative" title="Requests">
                <span
                  className="flex items-center justify-center transition-all"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isRequests ? 'rgba(216,90,48,0.12)' : 'transparent',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '22px', ...navItemStyle(isRequests) }}>receipt_long</span>
                </span>
                <span className="text-[10px] font-semibold" style={navItemStyle(isRequests)}>Requests</span>
              </Link>

              {/* Profile */}
              <Link to="/account" className="nav-tab flex flex-col items-center gap-0.5 touch-manipulation" title="Profile">
                <span
                  className="flex items-center justify-center transition-all"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isProfile ? 'rgba(216,90,48,0.12)' : 'transparent',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '22px', ...navItemStyle(isProfile) }}>person</span>
                </span>
                <span className="text-[10px] font-semibold" style={navItemStyle(isProfile)}>Profile</span>
              </Link>
            </>
          ) : (
            <>
              {['loyalty', 'account_balance_wallet', 'qr_code_scanner', 'receipt_long', 'person'].map((icon, i) => {
                const labels = ['Cards', 'Wallet', 'Scan', 'Requests', 'Profile'];
                const isScan = icon === 'qr_code_scanner';
                return (
                  <span key={icon} className="flex flex-col items-center gap-0.5 cursor-not-allowed pointer-events-none select-none opacity-50">
                    {isScan ? (
                      <span className="flex items-center justify-center" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bd)', color: 'var(--s)', marginTop: '-12px' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>{icon}</span>
                      </span>
                    ) : (
                      <span className="material-symbols-rounded" style={{ fontSize: '22px', color: 'var(--t3)' }}>{icon}</span>
                    )}
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--t3)' }}>{labels[i]}</span>
                  </span>
                );
              })}
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
