import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { PWAInstallButton } from '../components/PWAInstallButton';

export function AdminLayout() {
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
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/admin/stores', icon: 'apartment', label: 'Partners' },
    { path: '/admin/branches', icon: 'storefront', label: 'Branches' },
  ];

  return (
    <div className="admin-theme flex flex-col min-h-screen min-h-[100dvh] md:flex-row" style={{ background: '#FAF9F6' }}>
      {/* Mobile Header */}
      <header className="flex items-center justify-between p-3 md:hidden safe-area-top" style={{ background: '#2C1A16', color: 'rgba(255,255,255,0.85)' }}>
        <button type="button" onClick={() => setMenuOpen((o) => !o)} className="p-2 -m-2 rounded" aria-label="Menu">
          <span className="material-symbols-rounded" style={{ color: 'rgba(255,255,255,0.85)' }}>{menuOpen ? 'close' : 'menu'}</span>
        </button>
        <span className="font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>Loyalty Admin</span>
        <span className="w-10" />
      </header>

      {/* Dark Sidebar - matching wireframe 23 (admin dark sidebar) */}
      <aside
        className={`fixed inset-0 z-40 flex flex-col w-[220px] max-w-[85vw] transform transition-transform duration-200 ease-out md:static md:inset-auto md:z-auto md:max-w-none md:transform-none md:shrink-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ background: '#2C1A16', color: 'rgba(255,255,255,0.85)' }}
      >
        {/* Sidebar header */}
        <div className="p-4 flex items-center justify-between md:block" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h1 className="font-bold text-lg" style={{ color: '#FFF', letterSpacing: '-0.03em' }}>Loyalty</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Admin · {phone}</p>
          </div>
          <button type="button" onClick={() => setMenuOpen(false)} className="p-2 md:hidden" aria-label="Close" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {/* Purple admin badge */}
        <div className="px-4 pt-3 pb-1">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.06em] rounded-full px-2.5 py-1"
            style={{ background: '#3D3A8C', color: '#FFF' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>shield</span>
            Super Admin
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 overflow-auto">
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg min-h-[44px] transition-colors mb-0.5"
              style={{
                background: isActive(item.path) ? 'rgba(216,90,48,0.15)' : 'transparent',
                color: isActive(item.path) ? '#D85A30' : 'rgba(255,255,255,0.65)',
              }}
              onClick={() => setMenuOpen(false)}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>{item.icon}</span>
              <span className="text-[13.5px] font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <PWAInstallButton />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg min-h-[44px] text-left transition-colors"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>logout</span>
            <span className="text-[13.5px] font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {menuOpen && <div className="fixed inset-0 z-30 md:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setMenuOpen(false)} aria-hidden />}

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 md:p-6 min-w-0">
        <Outlet />
      </main>

      <PWAInstallPrompt variant="login" />
    </div>
  );
}
