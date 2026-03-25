import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { branchesApi } from '../lib/api';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { PWAInstallButton } from '../components/PWAInstallButton';

export function SellerLayout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [storeName, setStoreName] = useState('');
  const name = auth.type === 'staff' ? auth.staff.name : '';
  const branchId = auth.type === 'staff' ? auth.staff.branchId : '';
  const pathname = location.pathname;

  useEffect(() => {
    if (!branchId) return;
    branchesApi.get(branchId).then((b) => setStoreName(b.branchName)).catch(() => {});
  }, [branchId]);

  const handleLogout = () => {
    logout();
    navigate('/staff-login');
  };

  const isActive = (path: string) => pathname.startsWith(path);

  const navItemStyle = (active: boolean) => ({
    color: active ? 'var(--a)' : 'var(--t3)',
  });

  return (
    <div className="flex flex-col h-screen h-[100dvh] overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Staff Header - matching wireframe 11 */}
      <header className="flex-shrink-0" style={{ background: 'var(--s)', borderBottom: '1px solid var(--bdl)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {storeName && (
                  <span className="status-pill live">
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gr)', display: 'inline-block' }} />
                    Live
                  </span>
                )}
                <h1 className="font-semibold text-base truncate" style={{ color: 'var(--t)' }}>
                  {storeName || 'Staff Dashboard'}
                </h1>
              </div>
              {name && <p className="text-xs truncate" style={{ color: 'var(--t3)' }}>{name}</p>}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-4">
              <PWAInstallButton />
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 min-h-[38px] px-3 rounded-lg text-sm font-medium transition"
                style={{ color: 'var(--re)', background: 'var(--rebg)' }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>logout</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <Outlet />
      </main>

      <PWAInstallPrompt variant="login" />

      {/* Bottom Navigation - matching wireframe 11 */}
      <nav className="fixed bottom-0 left-0 right-0 flex-shrink-0 safe-area-pb z-50" style={{ background: 'var(--s)', borderTop: '1px solid var(--bdl)', height: '80px', padding: '0 8px 14px' }}>
        <div className="max-w-md mx-auto flex justify-around items-center h-full">
          <Link to="/seller/dashboard" className="nav-tab flex flex-col items-center gap-0.5 touch-manipulation">
            <span className="material-symbols-rounded" style={{ fontSize: '22px', ...navItemStyle(isActive('/seller/dashboard')) }}>checklist</span>
            <span className="text-[10px] font-semibold" style={navItemStyle(isActive('/seller/dashboard'))}>Check-ins</span>
          </Link>
          <Link to="/seller/approve" className="nav-tab flex flex-col items-center gap-0.5 touch-manipulation">
            <span className="material-symbols-rounded" style={{ fontSize: '22px', ...navItemStyle(isActive('/seller/approve')) }}>check_circle</span>
            <span className="text-[10px] font-semibold" style={navItemStyle(isActive('/seller/approve'))}>Approve</span>
          </Link>
          <Link to="/seller/rewards" className="nav-tab flex flex-col items-center gap-0.5 touch-manipulation">
            <span className="material-symbols-rounded" style={{ fontSize: '22px', ...navItemStyle(isActive('/seller/rewards')) }}>confirmation_number</span>
            <span className="text-[10px] font-semibold" style={navItemStyle(isActive('/seller/rewards'))}>Redeem</span>
          </Link>
          <Link to="/seller/history" className="nav-tab flex flex-col items-center gap-0.5 touch-manipulation">
            <span className="material-symbols-rounded" style={{ fontSize: '22px', ...navItemStyle(isActive('/seller/history')) }}>history</span>
            <span className="text-[10px] font-semibold" style={navItemStyle(isActive('/seller/history'))}>History</span>
          </Link>
          <Link to="/seller/qr" className="nav-tab flex flex-col items-center gap-0.5 touch-manipulation">
            <span className="material-symbols-rounded" style={{ fontSize: '22px', ...navItemStyle(isActive('/seller/qr')) }}>qr_code_2</span>
            <span className="text-[10px] font-semibold" style={navItemStyle(isActive('/seller/qr'))}>QR</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
