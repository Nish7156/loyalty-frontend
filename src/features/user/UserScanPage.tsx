import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customersApi, activityApi, branchesApi, authApi } from '../../lib/api';
import type { Branch } from '../../lib/api';
import { QRReader } from '../../components/QRReader';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { QRCodeSVG } from 'qrcode.react';

export function UserScanPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<'scan' | 'phone' | 'otp' | 'checkin' | 'done'>('phone');
  const [branchId, setBranchId] = useState(storeId || '');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  useEffect(() => {
    if (storeId) {
      setBranchId(storeId);
      setStep('phone');
    } else {
      setStep('scan');
      setBranchesLoading(true);
      branchesApi
        .list()
        .then(setBranches)
        .catch(() => setBranches([]))
        .finally(() => setBranchesLoading(false));
    }
  }, [storeId]);

  const handleScan = (code: string) => {
    const id = code.trim();
    setBranchId(id);
    setStep('phone');
  };

  const handleSelectStore = (id: string) => {
    navigate(`/scan/${id}`);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !branchId) return;
    setError('');
    setLoading(true);
    try {
      await customersApi.getByPhone(phone.trim());
      // Existing customer — go straight to check-in
      setStep('checkin');
    } catch {
      // New customer — send OTP and go to OTP entry
      try {
        await authApi.sendOtp(phone.trim());
        setStep('otp');
        setOtp('');
      } catch (err) {
        // sendOtp throws "Phone not registered" for new customers — that's expected
        // The customer registration endpoint handles this, so just proceed to OTP step
        setStep('otp');
        setOtp('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await customersApi.register({ branchId, phoneNumber: phone.trim(), otp: otp.trim() });
      setStep('checkin');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await activityApi.checkIn({
        branchId,
        phoneNumber: phone.trim(),
        value: amount.trim() ? Number(amount) : undefined,
      });
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const showAllStores = step === 'scan' && !storeId;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Store Check-in</h1>

      {showAllStores && (
        <>
          <h2 className="text-sm font-medium text-gray-700 mb-3">All stores – scan or tap to check in</h2>
          {branchesLoading ? (
            <p className="text-gray-500">Loading stores…</p>
          ) : branches.length === 0 ? (
            <p className="text-gray-500">No stores yet.</p>
          ) : (
            <div className="space-y-4 mb-6">
              {branches.map((b) => {
                const scanUrl = typeof window !== 'undefined' ? `${window.location.origin}/scan/${b.id}` : '';
                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
                  >
                    <div className="flex-shrink-0">
                      <QRCodeSVG value={scanUrl} size={80} level="M" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{b.branchName}</p>
                      <Button
                        type="button"
                        variant="secondary"
                        className="mt-2"
                        onClick={() => handleSelectStore(b.id)}
                      >
                        Check in here
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-sm text-gray-500 mb-2">Or scan a store QR / enter code:</p>
          <QRReader onScan={handleScan} placeholder="Scan store QR or enter store ID" />
        </>
      )}

      {step === 'phone' && branchId && (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+15551234567"
            required
            autoComplete="tel"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Checking…' : 'Continue'}
          </Button>
        </form>
      )}

      {step === 'otp' && branchId && (
        <form onSubmit={handleRegister} className="space-y-4">
          <p className="text-sm text-gray-600">New here! An OTP has been sent to <strong>{phone}</strong>.</p>
          <Input
            label="Enter OTP"
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="1111"
            required
            autoComplete="one-time-code"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Verifying…' : 'Verify & Register'}
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={() => { setStep('phone'); setError(''); }}>
            Change number
          </Button>
        </form>
      )}

      {step === 'checkin' && (
        <form onSubmit={handleCheckIn} className="space-y-4">
          <p className="text-gray-600">Check-in for {phone}</p>
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Submitting…' : 'Submit'}
          </Button>
        </form>
      )}

      {step === 'done' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="font-medium text-green-800">Check-in submitted!</p>
          <p className="text-sm text-green-700 mt-1">Staff will verify amount and approve.</p>
          <Button className="mt-4" onClick={() => { setStep('checkin'); setAmount(''); setError(''); }}>
            Another check-in
          </Button>
        </div>
      )}
    </div>
  );
}
