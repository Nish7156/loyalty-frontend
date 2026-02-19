import { Link, Outlet } from 'react-router-dom';

export function UserLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <Link to="/scan" className="font-semibold text-gray-800">
          Loyalty
        </Link>
        <Link to="/me" className="text-sm text-blue-600">My profile</Link>
      </header>
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
