import { useAuth } from '../../contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

export function StoreQRPage() {
  const { auth } = useAuth();
  const branchId = auth.type === 'staff' ? auth.staff.branchId : '';

  if (!branchId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16 rounded-xl" style={{ background: 'var(--s)', border: '1px solid var(--bdl)' }}>
          <span className="material-symbols-rounded" style={{ fontSize: '64px', color: 'var(--t3)' }}>storefront</span>
          <p className="text-lg" style={{ color: 'var(--t2)' }}>No branch assigned</p>
        </div>
      </div>
    );
  }

  const scanUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${branchId}`;

  return (
    <div className="max-w-2xl mx-auto w-full min-w-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24" style={{ background: 'var(--bg)' }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--t)' }}>Store QR Code</h1>
        <p style={{ color: 'var(--t2)' }}>Display this QR code for customers to scan and check in</p>
      </div>

      <div className="rounded-2xl p-4 sm:p-6 lg:p-8" style={{ background: 'var(--bdl)', border: '1px solid var(--bd)', boxShadow: '0 1px 3px rgba(26,24,22,0.05)' }}>
        <div className="rounded-xl shadow-inner p-8 mb-6" style={{ background: 'var(--s)' }}>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mb-4" style={{ background: 'var(--bdl)', color: 'var(--a)' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>smartphone</span>
              <span>Scan to Check In</span>
            </div>
            <p className="text-xs font-mono break-all px-4" style={{ color: 'var(--t3)' }}>{scanUrl}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: 'var(--s)', border: '1px solid var(--bd)' }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold" style={{ background: 'var(--bdl)', color: 'var(--a)' }}>
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--t)' }}>Display QR Code</h3>
                <p className="text-sm" style={{ color: 'var(--t2)' }}>Place this QR code at your checkout counter or entrance where customers can easily scan it</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: 'var(--s)', border: '1px solid var(--bd)' }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold" style={{ background: 'var(--bdl)', color: 'var(--a)' }}>
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--t)' }}>Customer Scans</h3>
                <p className="text-sm" style={{ color: 'var(--t2)' }}>Customers use their phone camera to scan the QR code and submit their check-in request</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: 'var(--s)', border: '1px solid var(--bd)' }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold" style={{ background: 'var(--bdl)', color: 'var(--a)' }}>
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--t)' }}>Approve Check-in</h3>
                <p className="text-sm" style={{ color: 'var(--t2)' }}>Review and approve check-ins from your dashboard to award loyalty points or stamps</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--s)', border: '1px solid var(--bd)' }}>
          <p className="text-sm" style={{ color: 'var(--t)' }}>
            <span className="font-semibold"><span className="material-symbols-rounded" style={{ fontSize: '16px', verticalAlign: 'text-bottom' }}>lightbulb</span> Tip:</span> You can print this QR code or display it on a tablet for easier customer access
          </p>
        </div>
      </div>
    </div>
  );
}
