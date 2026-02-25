import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';

export function AdminLayout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const phone = auth.type === 'platform' ? auth.user.phone : '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-gray-100 md:flex-row">
      <header className="flex items-center justify-between p-3 bg-gray-800 text-white md:hidden safe-area-top">
        <button type="button" onClick={() => setMenuOpen((o) => !o)} className="p-2 -m-2 rounded hover:bg-gray-700" aria-label="Menu">
          <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
        </button>
        <span className="font-bold">Loyalty Admin</span>
        <span className="w-10" />
      </header>
      <aside
        className={`fixed inset-0 z-40 flex flex-col w-56 max-w-[85vw] bg-gray-800 text-white transform transition-transform duration-200 ease-out md:static md:inset-auto md:z-auto md:max-w-none md:transform-none md:shrink-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between md:block">
          <div>
            <h1 className="font-bold text-lg">Loyalty Admin</h1>
            <p className="text-sm text-gray-400 truncate">{phone}</p>
          </div>
          <button type="button" onClick={() => setMenuOpen(false)} className="p-2 md:hidden" aria-label="Close">✕</button>
        </div>
        <nav className="flex-1 p-2 overflow-auto">
          <Link to="/admin/dashboard" className="block px-3 py-2.5 rounded hover:bg-gray-700 min-h-[44px] flex items-center" onClick={() => setMenuOpen(false)}>
            Dashboard
          </Link>
          <Link to="/admin/stores" className="block px-3 py-2.5 rounded hover:bg-gray-700 min-h-[44px] flex items-center" onClick={() => setMenuOpen(false)}>
            Stores
          </Link>
        </nav>
        <div className="p-2 border-t border-gray-700">
          <Button variant="ghost" className="w-full text-left text-white min-h-[44px]" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </aside>
      {menuOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setMenuOpen(false)} aria-hidden />}
      <main className="flex-1 overflow-auto p-4 md:p-6 min-w-0">
        <Outlet />
      </main>
      <PWAInstallPrompt variant="login" />
    </div>
  );
}
