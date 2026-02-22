import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleGate } from './RoleGate';
import { AdminLayout } from '../layouts/AdminLayout';
import { SellerLayout } from '../layouts/SellerLayout';
import { OwnerLayout } from '../layouts/OwnerLayout';
import { UserLayout } from '../layouts/UserLayout';
import { Loader } from '../components/Loader';
import { getCustomerTokenIfPresent } from '../lib/api';
import { LoginPage } from '../features/auth/LoginPage';
import { CustomerLoginPage } from '../features/user/CustomerLoginPage';
import { UserScanPage } from '../features/user/UserScanPage';
import { UserProfilePage } from '../features/user/UserProfilePage';
import { UserHistoryPage } from '../features/user/UserHistoryPage';
import { UserRewardsPage } from '../features/user/UserRewardsPage';

const AdminDashboard = lazy(() => import('../features/admin/Dashboard').then((m) => ({ default: m.AdminDashboard })));
const PartnersPage = lazy(() => import('../features/admin/PartnersPage').then((m) => ({ default: m.PartnersPage })));
const OwnerDashboard = lazy(() => import('../features/store-owner/Dashboard').then((m) => ({ default: m.OwnerDashboard })));
const BranchesPage = lazy(() => import('../features/store-owner/BranchesPage').then((m) => ({ default: m.BranchesPage })));
const StaffPage = lazy(() => import('../features/store-owner/StaffPage').then((m) => ({ default: m.StaffPage })));
const SellerDashboard = lazy(() => import('../features/seller/SellerDashboard').then((m) => ({ default: m.SellerDashboard })));
const ApprovePage = lazy(() => import('../features/seller/ApprovePage').then((m) => ({ default: m.ApprovePage })));
const SellerHistory = lazy(() => import('../features/seller/SellerHistory').then((m) => ({ default: m.SellerHistory })));
const StoreQRPage = lazy(() => import('../features/seller/StoreQRPage').then((m) => ({ default: m.StoreQRPage })));

function Fallback() {
  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center bg-[var(--premium-bg)]">
      <Loader message="Loading…" />
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/staff-login" element={<Navigate to="/login" replace />} />

        <Route path="/" element={<UserLayout />}>
          <Route index element={getCustomerTokenIfPresent() ? <Navigate to="/me" replace /> : <CustomerLoginPage />} />
          <Route path="scan" element={<Navigate to="/" replace />} />
          <Route path="scan/:storeId" element={<UserScanPage />} />
          <Route path="history" element={<UserHistoryPage />} />
          <Route path="rewards" element={<UserRewardsPage />} />
          <Route path="me" element={<UserProfilePage />} />
        </Route>

        <Route element={<RoleGate allowedRoles={['STAFF']} />}>
          <Route path="/seller" element={<SellerLayout />}>
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="approve" element={<ApprovePage />} />
            <Route path="history" element={<SellerHistory />} />
            <Route path="qr" element={<StoreQRPage />} />
          </Route>
        </Route>

        <Route element={<RoleGate allowedRoles={['PARTNER_OWNER']} />}>
          <Route path="/owner" element={<OwnerLayout />}>
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="staff" element={<StaffPage />} />
          </Route>
        </Route>

        <Route element={<RoleGate allowedRoles={['SUPER_ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="stores" element={<PartnersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
