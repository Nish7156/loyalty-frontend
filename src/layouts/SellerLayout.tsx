import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { branchesApi } from '../lib/api';
import { Button } from '../components/Button';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { PWAInstallButton } from '../components/PWAInstallButton';

export function SellerLayout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState('');
  const name = auth.type === 'staff' ? auth.staff.name : '';
  const branchId = auth.type === 'staff' ? auth.staff.branchId : '';

  useEffect(() => {
    if (!branchId) return;
    branchesApi.get(branchId).then((b) => setStoreName(b.branchName)).catch(() => {});
  }, [branchId]);

  const handleLogout = () => {
    logout();
    navigate('/staff-login');
  };

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-gray-50 pb-20">
      <header className="bg-white border-b px-3 py-3 md:px-4 flex justify-between items-center safe-area-top shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-base md:text-lg truncate">{storeName || 'Seller'}</h1>
          {storeName && <p className="text-xs text-gray-500 truncate">{name}</p>}
        </div>
        {!storeName && <span className="text-sm text-gray-600 truncate ml-2">{name}</span>}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton />
          <Button variant="ghost" onClick={handleLogout} className="min-h-[44px] min-w-[44px]">
            Logout
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-3 md:p-4 min-w-0">
        <Outlet />
      </main>
      <PWAInstallPrompt variant="login" />
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 safe-area-pb">
        <Link to="/seller/dashboard" className="flex flex-col items-center justify-center min-h-[56px] min-w-[64px] text-gray-600 hover:text-blue-600 active:text-blue-700 touch-manipulation">
          <span className="text-xl">📋</span>
          <span className="text-xs">Dashboard</span>
        </Link>
        <Link to="/seller/approve" className="flex flex-col items-center justify-center min-h-[56px] min-w-[64px] text-gray-600 hover:text-blue-600 active:text-blue-700 touch-manipulation">
          <span className="text-xl">✓</span>
          <span className="text-xs">Approve</span>
        </Link>
        <Link to="/seller/history" className="flex flex-col items-center justify-center min-h-[56px] min-w-[64px] text-gray-600 hover:text-blue-600 active:text-blue-700 touch-manipulation">
          <span className="text-xl">📜</span>
          <span className="text-xs">History</span>
        </Link>
        <Link to="/seller/rewards" className="flex flex-col items-center justify-center min-h-[56px] min-w-[64px] text-gray-600 hover:text-blue-600 active:text-blue-700 touch-manipulation">
          <span className="text-xl">🎁</span>
          <span className="text-xs">Rewards</span>
        </Link>
        <Link to="/seller/qr" className="flex flex-col items-center justify-center min-h-[56px] min-w-[64px] text-gray-600 hover:text-blue-600 active:text-blue-700 touch-manipulation">
          <span className="text-xl">📱</span>
          <span className="text-xs">QR</span>
        </Link>
      </nav>
    </div>
  );
}
