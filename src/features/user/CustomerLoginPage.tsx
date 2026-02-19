import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, setCustomerToken, getCustomerTokenIfPresent } from '../../lib/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getCustomerTokenIfPresent()) {
      navigate('/me', { replace: true });
    }
  }, [navigate]);

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
      navigate('/me', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  if (getCustomerTokenIfPresent()) {
    return null;
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
