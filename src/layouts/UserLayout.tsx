import { Link, Outlet, useLocation } from 'react-router-dom';

export function UserLayout() {
  const location = useLocation();
  const isMe = location.pathname === '/me';
  const isHistory = location.pathname === '/history';

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-[var(--premium-bg)] text-white safe-area">
      <header className="bg-white/[0.06] backdrop-blur-md border-b border-white/10 px-4 py-3 md:px-5 flex justify-center items-center safe-area-top shrink-0">
        <span className="font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent tracking-tight text-base md:text-lg">Loyalty</span>
      </header>
      <main className="flex-1 overflow-auto p-4 pb-8 md:p-5 min-w-0">
        <Outlet />
      </main>
      <nav className="bg-white/[0.06] backdrop-blur-md border-t border-white/10 flex justify-center items-center gap-1 py-2 safe-area-bottom">
        <Link
          to="/history"
          className={`flex flex-col items-center gap-1 py-3 px-6 rounded-2xl min-w-[72px] min-h-[52px] justify-center transition-all duration-200 touch-manipulation md:min-h-0 md:py-2.5 ${
            isHistory ? 'text-cyan-400 bg-white/10' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">History</span>
        </Link>
        <Link
          to="/me"
          className={`flex flex-col items-center gap-1 py-3 px-6 rounded-2xl min-w-[72px] min-h-[52px] justify-center transition-all duration-200 touch-manipulation md:min-h-0 md:py-2.5 ${
            isMe ? 'text-cyan-400 bg-white/10' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
