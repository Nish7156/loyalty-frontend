import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, setCustomerToken, getCustomerTokenIfPresent } from '../../lib/api';
import { normalizeIndianPhone, DEFAULT_PHONE_PREFIX } from '../../lib/phone';
import { PhoneInput } from '../../components/PhoneInput';

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState(DEFAULT_PHONE_PREFIX);
  const [otp, setOtp] = useState('');
  const [mpin, setMpin] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await authApi.sendOtp(normalizeIndianPhone(phone.trim()));
      setMpin(res.otp ?? '');
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
      const res = await authApi.customerLogin(normalizeIndianPhone(phone.trim()), otp.trim());
      setCustomerToken(res.access_token);
      navigate('/me', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  if (getCustomerTokenIfPresent()) {
    return (
      <div className="max-w-md mx-auto pb-20 w-full min-w-0">
        <div className="rounded-2xl border p-6 shadow-[0_0_40px_-12px_rgba(0,0,0,0.15)]" style={{ borderColor: 'var(--user-border-subtle)', backgroundColor: 'var(--user-card-subtle)' }}>
          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent tracking-tight">Welcome</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--user-text-muted)' }}>You’re logged in. Scan a store QR to check in or view your profile.</p>
          <Link to="/me" className="hover-user-bg block w-full min-h-[48px] rounded-xl border font-medium flex items-center justify-center transition" style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}>
            My profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-20 w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent tracking-tight">Login or Register</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--user-text-muted)' }}>Enter your phone number to continue.</p>

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-5">
          <div className="rounded-2xl border p-5 shadow-[0_0_30px_-10px_rgba(0,0,0,0.15)]" style={{ borderColor: 'var(--user-border-subtle)', backgroundColor: 'var(--user-card-subtle)' }}>
            <PhoneInput
              label="Phone"
              value={phone}
              onChange={setPhone}
              placeholder="98765 43210"
              required
              autoComplete="tel"
              variant="dark"
            />
            {error && <p className="text-rose-500 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="hover-user-bg w-full min-h-[48px] mt-4 rounded-xl border font-medium transition disabled:opacity-50"
              style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}
            >
              {loading ? 'Sending…' : 'Continue'}
            </button>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-5">
          <div className="rounded-2xl border p-5 shadow-[0_0_30px_-10px_rgba(0,0,0,0.15)]" style={{ borderColor: 'var(--user-border-subtle)', backgroundColor: 'var(--user-card-subtle)' }}>
            <p className="text-sm mb-1" style={{ color: 'var(--user-text-muted)' }}>Your 4-digit verification code</p>
            {mpin && <p className="text-2xl font-mono font-bold text-cyan-500 tracking-[0.4em] mb-4">{mpin}</p>}
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--user-text-muted)' }}>Enter code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              required
              autoComplete="one-time-code"
              className="w-full min-h-[48px] rounded-xl border px-4 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/50 outline-none transition text-center text-lg tracking-widest"
              style={{ borderColor: 'var(--user-border-subtle)', backgroundColor: 'var(--user-input-bg)', color: 'var(--user-text)' }}
            />
            {error && <p className="text-rose-500 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="hover-user-bg w-full min-h-[48px] mt-4 rounded-xl border font-medium transition disabled:opacity-50"
              style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}
            >
              {loading ? 'Verifying…' : 'Send'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setError(''); }}
              className="hover-user-bg w-full mt-2 min-h-[44px] rounded-xl text-sm font-medium transition"
              style={{ color: 'var(--user-text-subtle)' }}
            >
              Change number
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
