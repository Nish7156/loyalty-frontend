import { Link, Outlet, useLocation } from 'react-router-dom';

export function UserLayout() {
  const location = useLocation();
  const isMe = location.pathname === '/me';

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-[var(--premium-bg)] text-[var(--premium-cream)] safe-area">
      <header className="bg-[var(--premium-surface)] border-b border-[var(--premium-border)] px-4 py-3 flex justify-center items-center safe-area-top">
        <span className="font-semibold text-[var(--premium-cream)] tracking-tight">Loyalty</span>
      </header>
      <main className="flex-1 overflow-auto p-4 pb-6">
        <Outlet />
      </main>
      <nav className="bg-[var(--premium-surface)] border-t border-[var(--premium-border)] flex justify-center items-center py-2 safe-area-bottom">
        <Link
          to="/me"
          className={`flex flex-col items-center gap-0.5 py-2 px-6 rounded-xl min-w-[80px] transition-colors ${
            isMe ? 'text-[var(--premium-gold)]' : 'text-[var(--premium-muted)]'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
