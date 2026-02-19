import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';

export function OwnerLayout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const phone = auth.type === 'platform' ? auth.user.phone : '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-56 bg-slate-800 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="font-bold text-lg">Store Owner</h1>
          <p className="text-sm text-slate-400 truncate">{phone}</p>
        </div>
        <nav className="flex-1 p-2">
          <Link
            to="/owner/dashboard"
            className="block px-3 py-2 rounded hover:bg-slate-700"
          >
            Dashboard
          </Link>
          <Link
            to="/owner/branches"
            className="block px-3 py-2 rounded hover:bg-slate-700"
          >
            Branches
          </Link>
          <Link
            to="/owner/staff"
            className="block px-3 py-2 rounded hover:bg-slate-700"
          >
            Staff
          </Link>
        </nav>
        <div className="p-2 border-t border-slate-700">
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
