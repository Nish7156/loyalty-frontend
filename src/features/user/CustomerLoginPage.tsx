import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi, setCustomerToken, getCustomerTokenIfPresent } from '../../lib/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export function CustomerLoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setError('');
    setLoading(true);
    try {
      await authApi.sendOtp(phone.trim());
      setStep('otp');
      setOtp('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !otp.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await authApi.customerLogin(phone.trim(), otp.trim());
      setCustomerToken(res.access_token);
      setStep('phone');
      setPhone('');
      setOtp('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  if (getCustomerTokenIfPresent()) {
    return (
      <div className="max-w-md mx-auto pb-20">
        <h1 className="text-xl font-bold mb-2 text-[var(--premium-cream)] tracking-tight">Welcome</h1>
        <p className="text-[var(--premium-muted)] text-sm mb-6">You’re logged in. Scan a store QR to check in or view your profile.</p>
        <div className="space-y-3">
          <Link to="/me" className="block">
            <Button fullWidth>My profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-20">
      <h1 className="text-xl font-bold mb-2 text-[var(--premium-cream)] tracking-tight">Login or Register</h1>
      <p className="text-[var(--premium-muted)] text-sm mb-6">Enter your phone number to continue.</p>

      {step === 'phone' && (
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
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Sending OTP…' : 'Continue'}
          </Button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <p className="text-sm text-[var(--premium-muted)]">OTP sent to <strong className="text-[var(--premium-cream)]">{phone}</strong></p>
          <Input
            label="OTP"
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="1111"
            required
            autoComplete="one-time-code"
          />
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Verifying…' : 'Log in'}
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={() => { setStep('phone'); setError(''); }}>
            Change number
          </Button>
        </form>
      )}
    </div>
  );
}
