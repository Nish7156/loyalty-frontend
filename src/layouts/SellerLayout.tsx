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
    <div className="flex flex-col h-screen h-[100dvh] bg-gray-50 overflow-hidden">
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-lg md:text-xl text-gray-900 truncate">{storeName || 'Seller Dashboard'}</h1>
              {storeName && <p className="text-xs text-gray-500 truncate">{name}</p>}
            </div>
            {!storeName && <span className="text-sm text-gray-600 truncate ml-2">{name}</span>}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-4">
              <PWAInstallButton />
              <Button variant="ghost" onClick={handleLogout} className="min-h-[44px] px-3 sm:px-4 text-sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto min-w-0">
        <Outlet />
      </main>
      <PWAInstallPrompt variant="login" />
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg flex-shrink-0 safe-area-pb z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-around">
            <Link to="/seller/dashboard" className="flex flex-col items-center justify-center py-2 px-3 min-h-[64px] min-w-[64px] text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 active:text-indigo-700 transition-colors touch-manipulation">
              <span className="text-2xl mb-1">📋</span>
              <span className="text-xs font-medium">Dashboard</span>
            </Link>
            <Link to="/seller/approve" className="flex flex-col items-center justify-center py-2 px-3 min-h-[64px] min-w-[64px] text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 active:text-indigo-700 transition-colors touch-manipulation">
              <span className="text-2xl mb-1">✓</span>
              <span className="text-xs font-medium">Approve</span>
            </Link>
            <Link to="/seller/history" className="flex flex-col items-center justify-center py-2 px-3 min-h-[64px] min-w-[64px] text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 active:text-indigo-700 transition-colors touch-manipulation">
              <span className="text-2xl mb-1">📜</span>
              <span className="text-xs font-medium">History</span>
            </Link>
            <Link to="/seller/rewards" className="flex flex-col items-center justify-center py-2 px-3 min-h-[64px] min-w-[64px] text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 active:text-indigo-700 transition-colors touch-manipulation">
              <span className="text-2xl mb-1">🎁</span>
              <span className="text-xs font-medium">Rewards</span>
            </Link>
            <Link to="/seller/qr" className="flex flex-col items-center justify-center py-2 px-3 min-h-[64px] min-w-[64px] text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 active:text-indigo-700 transition-colors touch-manipulation">
              <span className="text-2xl mb-1">📱</span>
              <span className="text-xs font-medium">QR</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
