import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { PWAInstallButton } from '../components/PWAInstallButton';

export function OwnerLayout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const phone = auth.type === 'platform' ? auth.user.phone : '';
  const pathname = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => pathname.startsWith(path);

  const sidebarItems = [
    { path: '/owner/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/owner/branches', icon: 'storefront', label: 'Branches' },
    { path: '/owner/staff', icon: 'group', label: 'Staff' },
  ];

  return (
    <div className="partner-theme flex flex-col h-screen h-[100dvh] md:flex-row overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Mobile Header */}
      <header className="flex items-center justify-between p-3 md:hidden safe-area-top flex-shrink-0" style={{ background: 'var(--s)', borderBottom: '1px solid var(--bdl)' }}>
        <button type="button" onClick={() => setMenuOpen((o) => !o)} className="p-2 -m-2 rounded" aria-label="Menu">
          <span className="material-symbols-rounded" style={{ color: 'var(--t)' }}>{menuOpen ? 'close' : 'menu'}</span>
        </button>
        <span className="font-bold" style={{ color: 'var(--t)', letterSpacing: '-0.03em' }}>loyale. partner</span>
        <span className="w-10" />
      </header>

      {/* Light Sidebar - matching wireframe 14 (partner sidebar) */}
      <aside
        className={`fixed inset-0 z-40 flex flex-col w-[220px] max-w-[85vw] transform transition-transform duration-200 ease-out md:static md:inset-auto md:z-auto md:max-w-none md:transform-none md:shrink-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ background: 'var(--s)', borderRight: '1px solid var(--bdl)' }}
      >
        {/* Sidebar header */}
        <div className="p-4 flex items-center justify-between md:block" style={{ borderBottom: '1px solid var(--bdl)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--bdl)',
                border: '1.5px solid var(--bd)',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '14px', color: 'var(--a)' }}>person</span>
            </div>
            <div>
              <h1 className="text-[18px] font-bold" style={{ color: 'var(--t)', letterSpacing: '-0.03em' }}>loyale.</h1>
              <p className="text-[11px]" style={{ color: 'var(--t3)' }}>Partner · {phone}</p>
            </div>
          </div>
          <button type="button" onClick={() => setMenuOpen(false)} className="p-2 md:hidden" aria-label="Close" style={{ color: 'var(--t3)' }}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 overflow-auto">
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg min-h-[44px] transition-colors mb-0.5"
              style={{
                background: isActive(item.path) ? 'var(--bdl)' : 'transparent',
                color: isActive(item.path) ? 'var(--a)' : 'var(--t2)',
              }}
              onClick={() => setMenuOpen(false)}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>{item.icon}</span>
              <span className="text-[13.5px] font-semibold">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2" style={{ borderTop: '1px solid var(--bdl)' }}>
          <PWAInstallButton />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg min-h-[44px] text-left transition-colors"
            style={{ color: 'var(--re)' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>logout</span>
            <span className="text-[13.5px] font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {menuOpen && <div className="fixed inset-0 z-30 md:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setMenuOpen(false)} aria-hidden />}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <Outlet />
      </main>

      <PWAInstallPrompt variant="login" />
    </div>
  );
}
