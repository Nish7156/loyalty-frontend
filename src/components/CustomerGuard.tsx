import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCustomerTokenIfPresent } from '../lib/api';
import { Loader } from './Loader';

/**
 * Ensures customer token is present after mount (avoids first-render timing issues).
 * Redirects to / when not logged in so History/Rewards never show login card when user is logged in.
 */
export function CustomerGuard({ children }: { children: React.ReactNode }) {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    setHasToken(!!getCustomerTokenIfPresent());
  }, []);

  if (hasToken === null) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center w-full">
        <Loader message="Loading…" />
      </div>
    );
  }

  if (!hasToken) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
