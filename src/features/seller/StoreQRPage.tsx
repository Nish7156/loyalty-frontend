import { useAuth } from '../../contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

export function StoreQRPage() {
  const { auth } = useAuth();
  const branchId = auth.type === 'staff' ? auth.staff.branchId : '';

  if (!branchId) return <p className="text-gray-500">No branch.</p>;

  const scanUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${branchId}`;

  return (
    <div className="max-w-sm mx-auto w-full min-w-0">
      <h1 className="text-lg font-bold mb-3 md:text-xl md:mb-4">Store QR Code</h1>
      <p className="text-sm text-gray-600 mb-4">
        Customers scan this to check in. Branch ID is auto-filled.
      </p>
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex justify-center">
        <QRCodeSVG value={scanUrl} size={256} level="M" includeMargin className="max-w-full h-auto w-full" />
      </div>
      <p className="text-xs text-gray-400 mt-4 break-all">{scanUrl}</p>
    </div>
  );
}
