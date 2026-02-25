import { useEffect, useState, useRef } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { getCustomerTokenIfPresent, getCustomerPhoneFromToken, customersApi, feedbackApi } from '../lib/api';
import { createCustomerSocket } from '../lib/socket';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';

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
    if (phone) {
      setCustomerPhone(phone);
    } else {
      customersApi.getMyProfile().then((p) => setCustomerPhone(p.customer.phoneNumber)).catch(() => {});
    }
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
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-[var(--premium-bg)] text-white safe-area">
      <header className="relative bg-white/[0.06] backdrop-blur-md border-b border-white/10 h-12 md:h-14 shrink-0 safe-area-top">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="pointer-events-auto font-bold text-base md:text-lg tracking-widest uppercase bg-[length:200%_100%] bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-teal-300 bg-left hover:bg-right transition-[background-position] duration-500 select-none">
            Loyalty
          </span>
        </div>
        {hasToken && (
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition touch-manipulation"
            aria-label="Send feedback"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </button>
        )}
      </header>
      <main className="flex-1 overflow-auto p-4 pb-24 md:pb-24 md:p-5 min-w-0 capitalize">
        <Outlet />
      </main>
      {feedbackOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Feedback">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" onClick={closeFeedbackModal} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-[var(--premium-bg)] p-5 shadow-xl animate-scale-in max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Feedback</h2>
              <button type="button" onClick={closeFeedbackModal} disabled={feedbackSending} className="p-2 -m-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {feedbackSent ? (
              <div className="py-2">
                <p className="text-emerald-300 font-medium">Thank you!</p>
                <p className="text-white/70 text-sm mt-1">Your feedback has been sent.</p>
                <button type="button" onClick={() => setFeedbackSent(false)} className="mt-3 text-sm text-cyan-400 font-medium hover:text-cyan-300">Send another</button>
                <button type="button" onClick={closeFeedbackModal} className="block mt-2 text-sm text-white/60 hover:text-white">Close</button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit}>
                <label htmlFor="feedback-modal-message" className="block text-sm font-medium text-white/70 mb-2">What we can improve</label>
                <textarea
                  id="feedback-modal-message"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value.slice(0, MAX_FEEDBACK_LENGTH))}
                  placeholder="e.g. Faster check-in, better rewards..."
                  className="w-full min-h-[100px] rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-400/40 outline-none transition resize-y"
                  maxLength={MAX_FEEDBACK_LENGTH}
                  rows={3}
                  disabled={feedbackSending}
                />
                <p className="text-white/40 text-xs mt-1">{feedbackMessage.length}/{MAX_FEEDBACK_LENGTH}</p>
                {feedbackError && <p className="text-rose-400 text-sm mt-2">{feedbackError}</p>}
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={closeFeedbackModal} disabled={feedbackSending} className="flex-1 min-h-[44px] rounded-xl border border-white/30 text-white text-sm font-medium hover:bg-white/10 disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={feedbackSending || !feedbackMessage.trim()} className="flex-1 min-h-[44px] rounded-xl bg-cyan-400/90 text-black text-sm font-semibold hover:bg-cyan-300 disabled:opacity-50 disabled:pointer-events-none">
                    {feedbackSending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {showApprovalCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" aria-live="polite">
          <div className="bg-white/10 border border-white/20 rounded-2xl px-8 py-6 text-center shadow-xl animate-scale-in">
            <p className="text-2xl font-bold bg-gradient-to-r from-cyan-200 to-emerald-300 bg-clip-text text-transparent">Visit approved!</p>
            <p className="text-white/80 text-sm mt-1">Thanks for checking in.</p>
          </div>
        </div>
      )}
      <PWAInstallPrompt />
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white/[0.06] backdrop-blur-md border-t border-white/10 flex justify-center items-center gap-1 py-2 px-1 safe-area-bottom">
        {hasToken ? (
          <>
            <Link
              to="/me"
              className={`nav-tab flex flex-col items-center gap-1 py-3 px-4 rounded-2xl min-w-[64px] min-h-[52px] justify-center touch-manipulation md:min-h-0 md:py-2.5 flex-1 max-w-[100px] ${
                isMe ? 'text-cyan-400 bg-white/10 ring-1 ring-cyan-400/20' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wide">Profile</span>
            </Link>
            <Link
              to="/rewards"
              className={`nav-tab flex flex-col items-center gap-1 py-3 px-4 rounded-2xl min-w-[64px] min-h-[52px] justify-center touch-manipulation md:min-h-0 md:py-2.5 flex-1 max-w-[100px] ${
                isRewards ? 'text-cyan-400 bg-white/10 ring-1 ring-cyan-400/20' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wide">Rewards</span>
            </Link>
            <Link
              to="/history"
              className={`nav-tab flex flex-col items-center gap-1 py-3 px-4 rounded-2xl min-w-[64px] min-h-[52px] justify-center touch-manipulation md:min-h-0 md:py-2.5 flex-1 max-w-[100px] ${
                isHistory ? 'text-cyan-400 bg-white/10 ring-1 ring-cyan-400/20' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wide">History</span>
            </Link>
          </>
        ) : (
          <>
            <span className="nav-tab flex flex-col items-center gap-1 py-3 px-4 rounded-2xl min-w-[64px] min-h-[52px] justify-center md:min-h-0 md:py-2.5 flex-1 max-w-[100px] text-white/40 cursor-not-allowed pointer-events-none select-none" aria-disabled="true">
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wide">Profile</span>
            </span>
            <span className="nav-tab flex flex-col items-center gap-1 py-3 px-4 rounded-2xl min-w-[64px] min-h-[52px] justify-center md:min-h-0 md:py-2.5 flex-1 max-w-[100px] text-white/40 cursor-not-allowed pointer-events-none select-none" aria-disabled="true">
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wide">Rewards</span>
            </span>
            <span className="nav-tab flex flex-col items-center gap-1 py-3 px-4 rounded-2xl min-w-[64px] min-h-[52px] justify-center md:min-h-0 md:py-2.5 flex-1 max-w-[100px] text-white/40 cursor-not-allowed pointer-events-none select-none" aria-disabled="true">
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
