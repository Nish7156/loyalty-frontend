import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, referralsApi, setCustomerToken, getCustomerTokenIfPresent } from '../../lib/api';
import { REFERRAL_CODE_KEY } from '../../App';
import { normalizeIndianPhone, DEFAULT_PHONE_PREFIX } from '../../lib/phone';
import { PhoneInput } from '../../components/PhoneInput';

function applyPendingReferral(normalizedPhone: string) {
  const ref = localStorage.getItem(REFERRAL_CODE_KEY);
  if (ref) {
    referralsApi.apply(ref, normalizedPhone).catch(() => {});
    localStorage.removeItem(REFERRAL_CODE_KEY);
  }
}

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState(DEFAULT_PHONE_PREFIX);
  const [otp, setOtp] = useState('');
  const [mpin, setMpin] = useState('');
  const [name, setName] = useState('');
  const [needsName, setNeedsName] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setError('');
    setLoading(true);
    try {
      const normalized = normalizeIndianPhone(phone.trim());
      const res = await authApi.sendOtp(normalized);

      if (res.skipOtp) {
        const loginRes = await authApi.customerLogin(normalized);
        setCustomerToken(loginRes.access_token);
        applyPendingReferral(normalized);
        navigate('/me', { replace: true });
        return;
      }

      setMpin(res.otp ?? '');
      setNeedsName(!!res.needsName);
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

    // If customer has no name, ask for it first
    if (needsName) {
      setStep('name');
      return;
    }

    setLoading(true);
    try {
      const normalized = normalizeIndianPhone(phone.trim());
      const res = await authApi.customerLogin(normalized, otp.trim());
      setCustomerToken(res.access_token);
      applyPendingReferral(normalized);
      navigate('/me', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your name (at least 2 characters)');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const normalized = normalizeIndianPhone(phone.trim());
      const res = await authApi.customerLogin(normalized, otp.trim(), name.trim());
      setCustomerToken(res.access_token);
      applyPendingReferral(normalized);
      navigate('/me', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (getCustomerTokenIfPresent()) {
    return (
      <div className="max-w-md mx-auto pb-20 w-full min-w-0 overflow-hidden" style={{ paddingTop: '40px' }}>
        <div className="rounded-2xl p-5" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 4px 24px rgba(93,64,55,0.07)' }}>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--t)', letterSpacing: '-0.02em' }}>Welcome back</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--t2)' }}>You're logged in. Scan a store QR to check in or view your profile.</p>
          <Link
            to="/me"
            className="block w-full min-h-[52px] rounded-xl font-semibold flex items-center justify-center transition"
            style={{ background: 'var(--a)', color: 'var(--s)', fontSize: '15px' }}
          >
            My profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-20 w-full min-w-0 overflow-hidden" style={{ paddingTop: '40px' }}>
      {/* Wordmark */}
      <div className="text-center mb-8 a1">
        <h1 style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--t)', letterSpacing: '-0.03em' }}>
          Loyalty
        </h1>
      </div>

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-5 a2">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold" style={{ color: 'var(--t)', letterSpacing: '-0.02em' }}>
              Welcome.<br />What's your number?
            </h2>
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 4px 24px rgba(93,64,55,0.07)' }}>
            <PhoneInput
              label="Phone"
              value={phone}
              onChange={setPhone}
              placeholder="98765 43210"
              required
              autoComplete="tel"
              variant="dark"
            />
            {error && <p className="text-sm mt-2" style={{ color: 'var(--re)' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[52px] mt-4 rounded-xl font-semibold transition disabled:opacity-50"
              style={{ background: 'var(--a)', color: 'var(--s)', fontSize: '15px' }}
            >
              {loading ? 'Sending...' : 'Continue'}
            </button>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-5 a2">
          {/* OTP Icon */}
          <div className="flex justify-center">
            <div className="flex items-center justify-center" style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--bdl)' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '28px', color: 'var(--a)' }}>sms</span>
            </div>
          </div>
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold" style={{ color: 'var(--t)' }}>Enter the 4-digit code</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>Sent to {phone}</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 4px 24px rgba(93,64,55,0.07)' }}>
            {mpin && (
              <p className="text-2xl font-bold tracking-[0.4em] mb-4 text-center" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--a)' }}>
                {mpin}
              </p>
            )}
            <label className="block text-xs font-medium uppercase tracking-[0.02em] mb-2" style={{ color: 'var(--t2)' }}>Enter code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              required
              autoComplete="one-time-code"
              className="w-full min-h-[50px] rounded-xl border px-4 outline-none transition text-center text-lg tracking-widest"
              style={{
                borderColor: otp ? 'var(--a)' : 'var(--bd)',
                backgroundColor: 'var(--bg)',
                color: 'var(--t)',
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: otp ? '0 0 0 3px var(--bdl)' : 'none',
              }}
            />
            {error && <p className="text-sm mt-2" style={{ color: 'var(--re)' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[52px] mt-4 rounded-xl font-semibold transition disabled:opacity-50"
              style={{ background: 'var(--a)', color: 'var(--s)', fontSize: '15px' }}
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setError(''); }}
              className="w-full mt-2 min-h-[44px] rounded-xl text-sm font-medium transition"
              style={{ color: 'var(--a)' }}
            >
              Wrong number?
            </button>
          </div>
        </form>
      )}

      {step === 'name' && (
        <form onSubmit={handleNameSubmit} className="space-y-5 a2">
          <div className="flex justify-center">
            <div className="flex items-center justify-center" style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--bdl)' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '28px', color: 'var(--a)' }}>person</span>
            </div>
          </div>
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold" style={{ color: 'var(--t)' }}>What's your name?</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>So stores can greet you properly</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 4px 24px rgba(93,64,55,0.07)' }}>
            <label className="block text-xs font-medium uppercase tracking-[0.02em] mb-2" style={{ color: 'var(--t2)' }}>Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              autoFocus
              autoComplete="name"
              className="w-full min-h-[50px] rounded-xl border px-4 outline-none transition text-lg"
              style={{
                borderColor: name.trim().length >= 2 ? 'var(--a)' : 'var(--bd)',
                backgroundColor: 'var(--bg)',
                color: 'var(--t)',
                boxShadow: name.trim().length >= 2 ? '0 0 0 3px var(--bdl)' : 'none',
              }}
            />
            {error && <p className="text-sm mt-2" style={{ color: 'var(--re)' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || name.trim().length < 2}
              className="w-full min-h-[52px] mt-4 rounded-xl font-semibold transition disabled:opacity-50"
              style={{ background: 'var(--a)', color: 'var(--s)', fontSize: '15px' }}
            >
              {loading ? 'Creating account...' : 'Get Started'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('otp'); setError(''); }}
              className="w-full mt-2 min-h-[44px] rounded-xl text-sm font-medium transition"
              style={{ color: 'var(--a)' }}
            >
              Back
            </button>
          </div>
        </form>
      )}

      {/* Terms footer */}
      <p className="text-center text-[11px] mt-8" style={{ color: 'var(--t3)' }}>
        By continuing you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
