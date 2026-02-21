import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi, setCustomerToken, getCustomerTokenIfPresent } from '../../lib/api';

function generateMpin(): string {
  return String(1000 + Math.floor(Math.random() * 9000));
}

export function CustomerLoginPage() {
  const [phone, setPhone] = useState('');
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
      const pin = generateMpin();
      setMpin(pin);
      await authApi.sendOtp(phone.trim(), pin);
      setStep('otp');
      setOtp('');
      // OTP (SMS) send – uncomment when ready: await authApi.sendOtp(phone.trim());
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
      <div className="max-w-md mx-auto pb-20 w-full min-w-0">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_40px_-12px_rgba(0,0,0,0.4)]">
          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent tracking-tight">Welcome</h1>
          <p className="text-white/60 text-sm mb-6">You’re logged in. Scan a store QR to check in or view your profile.</p>
          <Link to="/me" className="block w-full min-h-[48px] rounded-xl border border-white/30 text-white font-medium flex items-center justify-center hover:bg-white/10 transition">
            My profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-20 w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-transparent tracking-tight">Login or Register</h1>
      <p className="text-white/60 text-sm mb-6">Enter your phone number to continue.</p>

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_30px_-10px_rgba(0,0,0,0.3)]">
            <label className="block text-sm font-medium text-white/70 mb-2">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+15551234567"
              required
              autoComplete="tel"
              className="w-full min-h-[48px] rounded-xl border border-white/20 bg-black/30 px-4 text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/50 outline-none transition"
            />
            {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] mt-4 rounded-xl border border-white/40 text-white font-medium hover:bg-white/10 transition disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Continue'}
            </button>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_30px_-10px_rgba(0,0,0,0.3)]">
            <p className="text-sm text-white/60 mb-1">Your 4-digit MPIN</p>
            <p className="text-2xl font-mono font-bold text-cyan-300 tracking-[0.4em] mb-4">{mpin}</p>
            <label className="block text-sm font-medium text-white/70 mb-2">Enter MPIN</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              required
              autoComplete="one-time-code"
              className="w-full min-h-[48px] rounded-xl border border-white/20 bg-black/30 px-4 text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/50 outline-none transition text-center text-lg tracking-widest"
            />
            {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] mt-4 rounded-xl border border-white/40 text-white font-medium hover:bg-white/10 transition disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Send'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setError(''); }}
              className="w-full mt-2 min-h-[44px] rounded-xl text-white/50 text-sm font-medium hover:text-white/80 hover:bg-white/5 transition"
            >
              Change number
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
