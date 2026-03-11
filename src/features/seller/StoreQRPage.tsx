import { useAuth } from '../../contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

export function StoreQRPage() {
  const { auth } = useAuth();
  const branchId = auth.type === 'staff' ? auth.staff.branchId : '';

  if (!branchId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <div className="text-6xl mb-4">🏪</div>
          <p className="text-gray-500 text-lg">No branch assigned</p>
        </div>
      </div>
    );
  }

  const scanUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${branchId}`;

  return (
    <div className="max-w-2xl mx-auto w-full min-w-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Store QR Code</h1>
        <p className="text-gray-600">Display this QR code for customers to scan and check in</p>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/50 rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-inner p-8 mb-6">
          <div className="flex justify-center mb-6">
            <QRCodeSVG
              value={scanUrl}
              size={320}
              level="H"
              includeMargin
              className="max-w-full h-auto w-full"
            />
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium mb-4">
              <span className="text-lg">📱</span>
              <span>Scan to Check In</span>
            </div>
            <p className="text-xs text-gray-500 font-mono break-all px-4">{scanUrl}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-indigo-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-600 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Display QR Code</h3>
                <p className="text-sm text-gray-600">Place this QR code at your checkout counter or entrance where customers can easily scan it</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-indigo-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-600 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Customer Scans</h3>
                <p className="text-sm text-gray-600">Customers use their phone camera to scan the QR code and submit their check-in request</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-indigo-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-600 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Approve Check-in</h3>
                <p className="text-sm text-gray-600">Review and approve check-ins from your dashboard to award loyalty points or stamps</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-indigo-100 border border-indigo-300 rounded-xl">
          <p className="text-sm text-indigo-900">
            <span className="font-semibold">💡 Tip:</span> You can print this QR code or display it on a tablet for easier customer access
          </p>
        </div>
      </div>
    </div>
  );
}
