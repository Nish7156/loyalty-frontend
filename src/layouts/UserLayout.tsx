import { useEffect, useState, useRef } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { getCustomerTokenIfPresent, getCustomerPhoneFromToken, customersApi, feedbackApi } from '../lib/api';
import { createCustomerSocket } from '../lib/socket';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { PWAInstallButton } from '../components/PWAInstallButton';

const CHECKIN_UPDATED_EVENT = 'loyalty_checkin_updated';
const MAX_FEEDBACK_LENGTH = 2000;

/** Centralized customer auth: only show login at / when logged out; once logged in, never ask again on /me, /history, /rewards. */
export function UserLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  const hasToken = !!getCustomerTokenIfPresent();
  const isMe = pathname === '/me';
  const isHistory = pathname === '/history';
  const isRewards = pathname === '/rewards';
  const isRequests = pathname === '/requests';
  const isProfile = pathname === '/profile' || pathname === '/account';
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);
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
      .then((p) => setCustomerPhone(p.customer.phoneNumber))
      .catch(() => {});
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

  const navItemStyle = (active: boolean) => ({
    color: active ? '#D85A30' : '#A08880',
  });

  return (
    <div className="user-theme flex flex-col min-h-screen min-h-[100dvh] safe-area" style={{ background: '#FAF9F6', color: '#5D4037' }}>
      {/* Header - warm style matching wireframe 03 */}
      <header
        className="fixed top-0 left-0 right-0 z-30 safe-area-top safe-area-x"
        style={{
          padding: '14px 20px',
          backgroundColor: '#FFF',
          borderBottom: '1px solid #FAECE7',
        }}
      >
        <div className="max-w-md mx-auto w-full min-w-0 flex items-center justify-between">
          {/* Left: Wordmark */}
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#5D4037',
            }}
          >
            loyale.
          </span>

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
                  background: '#FAECE7',
                  border: '1.5px solid #F5C4B3',
                  color: '#D85A30',
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
                  background: '#FAECE7',
                  border: '2px solid #F5C4B3',
                  color: '#D85A30',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>person</span>
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
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingBottom: 'calc(94px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="max-w-md mx-auto w-full min-w-0">
          <Outlet />
        </div>
      </main>

      {/* Feedback Modal */}
      {feedbackOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Feedback">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(93,64,55,0.4)' }} aria-hidden="true" onClick={closeFeedbackModal} />
          <div className="relative w-full max-w-sm rounded-2xl border p-4 sm:p-5 shadow-xl animate-scale-in max-h-[90vh] overflow-auto safe-area-x min-w-0" style={{ backgroundColor: '#FFF', borderColor: '#FAECE7' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: '#5D4037' }}>Feedback</h2>
              <button type="button" onClick={closeFeedbackModal} disabled={feedbackSending} className="p-2 -m-2 rounded-lg disabled:opacity-50" style={{ color: '#A08880' }} aria-label="Close">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            {feedbackSent ? (
              <div className="py-2">
                <p className="font-medium" style={{ color: '#2A6040' }}>Thank you!</p>
                <p className="text-sm mt-1" style={{ color: '#7B5E54' }}>Your feedback has been sent.</p>
                <button type="button" onClick={() => setFeedbackSent(false)} className="mt-3 text-sm font-medium" style={{ color: '#D85A30' }}>Send another</button>
                <button type="button" onClick={closeFeedbackModal} className="block mt-2 text-sm" style={{ color: '#A08880' }}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit}>
                <label htmlFor="feedback-modal-message" className="block text-sm font-medium mb-2" style={{ color: '#7B5E54' }}>What we can improve</label>
                <textarea
                  id="feedback-modal-message"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value.slice(0, MAX_FEEDBACK_LENGTH))}
                  placeholder="e.g. Faster check-in, better rewards..."
                  className="w-full min-h-[100px] rounded-xl border px-4 py-3 outline-none transition resize-y"
                  style={{ backgroundColor: '#FAF9F6', borderColor: '#F5C4B3', color: '#5D4037' }}
                  maxLength={MAX_FEEDBACK_LENGTH}
                  rows={3}
                  disabled={feedbackSending}
                />
                <p className="text-xs mt-1" style={{ color: '#A08880' }}>{feedbackMessage.length}/{MAX_FEEDBACK_LENGTH}</p>
                {feedbackError && <p className="text-sm mt-2" style={{ color: '#B03A2A' }}>{feedbackError}</p>}
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={closeFeedbackModal} disabled={feedbackSending} className="flex-1 min-h-[44px] rounded-xl border text-sm font-medium disabled:opacity-50" style={{ borderColor: '#F5C4B3', color: '#7B5E54' }}>Cancel</button>
                  <button type="submit" disabled={feedbackSending || !feedbackMessage.trim()} className="flex-1 min-h-[52px] rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:pointer-events-none" style={{ background: '#D85A30' }}>
                    {feedbackSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Approval Celebration */}
      {showApprovalCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(93,64,55,0.4)' }} aria-live="polite">
          <div className="rounded-2xl border px-8 py-6 text-center shadow-xl animate-scale-in" style={{ backgroundColor: '#FFF', borderColor: '#FAECE7' }}>
            <div className="flex items-center justify-center mb-3" style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#E4F2EB', margin: '0 auto' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '32px', color: '#2A6040' }}>check_circle</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#2A6040' }}>Check-in approved!</p>
            <p className="text-sm mt-1" style={{ color: '#7B5E54' }}>Thanks for checking in.</p>
          </div>
        </div>
      )}

      <PWAInstallPrompt />

      {/* Bottom Navigation - matching wireframe 03 exactly */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 safe-area-bottom"
        style={{
          backgroundColor: '#FFF',
          borderTop: '1px solid #FAECE7',
          padding: '0 8px 14px',
          height: '80px',
        }}
      >
        <div className="flex justify-around items-center w-full max-w-md mx-auto h-full">
          {hasToken ? (
            <>
              {/* Cards */}
              <Link to="/me" className="nav-tab flex flex-col items-center gap-0.5 touch-manipulation" title="Cards">
                <span className="material-symbols-rounded" style={{ fontSize: '22px', ...navItemStyle(isMe) }}>loyalty</span>
                <span className="text-[10px] font-semibold" style={navItemStyle(isMe)}>Cards</span>
              </Link>

              {/* Wallet */}
              <Link to="/rewards" className="nav-tab flex flex-col items-center gap-0.5 touch-manipulation" title="Rewards">
                <span className="material-symbols-rounded" style={{ fontSize: '22px', ...navItemStyle(isRewards) }}>account_balance_wallet</span>
                <span className="text-[10px] font-semibold" style={navItemStyle(isRewards)}>Wallet</span>
              </Link>

              {/* Scan Button (center, prominent) */}
              <Link to="/requests" className="nav-tab flex flex-col items-center gap-0.5 touch-manipulation relative" title="Scan">
                <span
                  className="flex items-center justify-center scan-btn-breath"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#D85A30',
                    color: '#FFF',
                    boxShadow: '0 3px 10px rgba(216,90,48,0.28)',
                    marginTop: '-12px',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>qr_code_scanner</span>
                </span>
                <span className="text-[10px] font-semibold" style={navItemStyle(isRequests)}>Scan</span>
              </Link>

              {/* History */}
              <Link to="/history" className="nav-tab flex flex-col items-center gap-0.5 touch-manipulation" title="History">
                <span className="material-symbols-rounded" style={{ fontSize: '22px', ...navItemStyle(isHistory) }}>history</span>
                <span className="text-[10px] font-semibold" style={navItemStyle(isHistory)}>History</span>
              </Link>

              {/* Profile */}
              <Link to="/account" className="nav-tab flex flex-col items-center gap-0.5 touch-manipulation" title="Profile">
                <span className="material-symbols-rounded" style={{ fontSize: '22px', ...navItemStyle(isProfile) }}>person</span>
                <span className="text-[10px] font-semibold" style={navItemStyle(isProfile)}>Profile</span>
              </Link>
            </>
          ) : (
            <>
              {['loyalty', 'account_balance_wallet', 'qr_code_scanner', 'history', 'person'].map((icon, i) => {
                const labels = ['Cards', 'Wallet', 'Scan', 'History', 'Profile'];
                const isScan = icon === 'qr_code_scanner';
                return (
                  <span key={icon} className="flex flex-col items-center gap-0.5 cursor-not-allowed pointer-events-none select-none opacity-50">
                    {isScan ? (
                      <span className="flex items-center justify-center" style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F5C4B3', color: '#FFF', marginTop: '-12px' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>{icon}</span>
                      </span>
                    ) : (
                      <span className="material-symbols-rounded" style={{ fontSize: '22px', color: '#A08880' }}>{icon}</span>
                    )}
                    <span className="text-[10px] font-semibold" style={{ color: '#A08880' }}>{labels[i]}</span>
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
