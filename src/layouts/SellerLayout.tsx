import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { branchesApi } from '../lib/api';
import { Button } from '../components/Button';

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
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="font-semibold">{storeName || 'Seller'}</h1>
          {storeName && <p className="text-xs text-gray-500">{name}</p>}
        </div>
        {!storeName && <span className="text-sm text-gray-600">{name}</span>}
        <Button variant="ghost" onClick={handleLogout}>
          Logout
        </Button>
      </header>
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 safe-area-pb">
        <Link
          to="/seller/dashboard"
          className="flex flex-col items-center text-gray-600 hover:text-blue-600"
        >
          <span className="text-xl">📋</span>
          <span className="text-xs">Dashboard</span>
        </Link>
        <Link
          to="/seller/approve"
          className="flex flex-col items-center text-gray-600 hover:text-blue-600"
        >
          <span className="text-xl">✓</span>
          <span className="text-xs">Approve</span>
        </Link>
        <Link
          to="/seller/history"
          className="flex flex-col items-center text-gray-600 hover:text-blue-600"
        >
          <span className="text-xl">📜</span>
          <span className="text-xs">History</span>
        </Link>
        <Link
          to="/seller/qr"
          className="flex flex-col items-center text-gray-600 hover:text-blue-600"
        >
          <span className="text-xl">📱</span>
          <span className="text-xs">QR</span>
        </Link>
      </nav>
    </div>
  );
}
