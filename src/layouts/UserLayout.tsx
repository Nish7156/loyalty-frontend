import { Link, Outlet, useLocation } from 'react-router-dom';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';

export function UserLayout() {
  const location = useLocation();
  const isMe = location.pathname === '/me';
  const isHistory = location.pathname === '/history';
  const isRewards = location.pathname === '/rewards';

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-[var(--premium-bg)] text-white safe-area">
      <header className="relative bg-white/[0.06] backdrop-blur-md border-b border-white/10 h-12 md:h-14 shrink-0 safe-area-top">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="pointer-events-auto font-bold text-base md:text-lg tracking-widest uppercase bg-[length:200%_100%] bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-teal-300 bg-left hover:bg-right transition-[background-position] duration-500 select-none">
            Loyalty
          </span>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 pb-24 md:pb-24 md:p-5 min-w-0 capitalize">
        <Outlet />
      </main>
      <PWAInstallPrompt />
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white/[0.06] backdrop-blur-md border-t border-white/10 flex justify-center items-center gap-1 py-2 px-1 safe-area-bottom">
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
      </nav>
    </div>
  );
}
