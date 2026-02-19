import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';

export function AdminLayout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const phone = auth.type === 'platform' ? auth.user.phone : '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-56 bg-gray-800 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="font-bold text-lg">Loyalty Admin</h1>
          <p className="text-sm text-gray-400 truncate">{phone}</p>
        </div>
        <nav className="flex-1 p-2">
          <Link
            to="/admin/dashboard"
            className="block px-3 py-2 rounded hover:bg-gray-700"
          >
            Dashboard
          </Link>
          <Link
            to="/admin/partners"
            className="block px-3 py-2 rounded hover:bg-gray-700"
          >
            Partners
          </Link>
        </nav>
        <div className="p-2 border-t border-gray-700">
          <Button variant="ghost" className="w-full text-left text-white" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
