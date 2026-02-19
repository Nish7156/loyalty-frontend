import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { customersApi, activityApi } from '../../lib/api';
import { QRReader } from '../../components/QRReader';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

const DUMMY_OTP = '1111';

export function UserScanPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [step, setStep] = useState<'scan' | 'register' | 'checkin' | 'done'>('scan');
  const [branchId, setBranchId] = useState(storeId || '');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = (code: string) => {
    setBranchId(code);
    setStep('register');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await customersApi.register({ branchId, phoneNumber: phone, otp: otp || DUMMY_OTP });
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
        phoneNumber: phone,
        value: value ? Number(value) : undefined,
      });
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      setBranchId(storeId);
      setStep('register');
    }
  }, [storeId]);

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Store Check-in</h1>

      {step === 'scan' && !storeId && (
        <QRReader onScan={handleScan} placeholder="Scan store QR or enter store ID" />
      )}

      {step === 'register' && (
        <form onSubmit={handleRegister} className="space-y-4">
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+15551234567" required />
          <Input label="OTP (dummy: 1111)" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="1111" />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>{loading ? 'Registering…' : 'Register / Continue'}</Button>
        </form>
      )}

      {step === 'checkin' && (
        <form onSubmit={handleCheckIn} className="space-y-4">
          <p className="text-gray-600">Check-in for {phone}</p>
          <Input label="Amount (optional)" type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>{loading ? 'Submitting…' : 'Check in'}</Button>
        </form>
      )}

      {step === 'done' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="font-medium text-green-800">Check-in submitted!</p>
          <p className="text-sm text-green-700 mt-1">Waiting for staff approval.</p>
          <Button className="mt-4" onClick={() => { setStep('checkin'); setError(''); }}>Another check-in</Button>
        </div>
      )}
    </div>
  );
}
