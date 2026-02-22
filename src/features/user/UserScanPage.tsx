import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { customersApi, activityApi, branchesApi, authApi, rewardsApi, setCustomerToken, clearCustomerToken, getCustomerTokenIfPresent } from '../../lib/api';
import type { CustomerProfile, Reward } from '../../lib/api';
import { createBranchSocket } from '../../lib/socket';
import { Button } from '../../components/Button';
import { Loader } from '../../components/Loader';

type Step = 'phone' | 'otp' | 'checkin' | 'done';
type OtpMode = 'register' | 'customerLogin';

export function UserScanPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const branchId = storeId || '';
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [mpin, setMpin] = useState('');
  const [otpMode, setOtpMode] = useState<OtpMode>('register');
  const [registerName, setRegisterName] = useState('');
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [currentPartnerId, setCurrentPartnerId] = useState<string | null>(null);
  const [lastActivityId, setLastActivityId] = useState<string | null>(null);
  const [checkinStatus, setCheckinStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const socketRef = useRef<ReturnType<typeof createBranchSocket> | null>(null);

  const isLoggedIn = !!getCustomerTokenIfPresent();
  const displayPhone = profile?.customer?.phoneNumber ?? phone;
  const displayName = profile?.customer?.name?.trim() || customerName.trim() || displayPhone;

  useEffect(() => {
    const token = getCustomerTokenIfPresent();
    if (token && branchId) {
      setProfileLoading(true);
      customersApi
        .getMyProfile()
        .then((p) => {
          setProfile(p);
          setPhone(p.customer.phoneNumber);
          setStep('checkin');
          if (p.customer.name?.trim() && !customerName.trim()) {
            setCustomerName(p.customer.name.trim());
          }
          const store = p.storesVisited?.find((s) => s.branchId === branchId);
          setCurrentPartnerId(store?.partnerId ?? null);
        })
        .catch(() => {
          clearCustomerToken();
          setStep('phone');
        })
        .finally(() => setProfileLoading(false));
    } else if (!token && branchId) {
      setStep('phone');
    }
  }, [branchId]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !branchId) return;
    setError('');
    setLoading(true);
    try {
      await customersApi.getByPhone(phone.trim());
      setStep('checkin');
    } catch {
      try {
        const res = await authApi.sendOtp(phone.trim());
        setMpin(res.otp ?? '');
        setOtpMode('register');
        setStep('otp');
        setOtp('');
        setRegisterName('');
      } catch {
        setOtpMode('register');
        setStep('otp');
        setOtp('');
        setRegisterName('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStayLoggedIn = async () => {
    if (!phone.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await authApi.sendOtp(phone.trim());
      setMpin(res.otp ?? '');
      setOtpMode('customerLogin');
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
    if (otpMode === 'register') {
      const nameTrimmed = registerName.trim();
      if (nameTrimmed.length < 2) {
        setError('Please enter your name (at least 2 characters)');
        return;
      }
      if (nameTrimmed.length > 200) {
        setError('Name must be at most 200 characters');
        return;
      }
    }
    setError('');
    setLoading(true);
    try {
      if (otpMode === 'customerLogin') {
        const res = await authApi.customerLogin(phone.trim(), otp.trim());
        setCustomerToken(res.access_token);
        setPhone(res.customer.phone);
        setProfile(null);
        const p = await customersApi.getMyProfile();
        setProfile(p);
        setStep('checkin');
      } else {
        const nameToSave = registerName.trim().slice(0, 200);
        const res = await customersApi.register({
          branchId,
          phoneNumber: phone.trim(),
          name: nameToSave,
          otp: otp.trim(),
        });
        setCustomerToken(res.access_token);
        setPhone(res.customer.phone);
        setCustomerName(nameToSave);
        setStep('checkin');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : otpMode === 'customerLogin' ? 'Invalid OTP' : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const nameStr = typeof customerName === 'string' ? customerName.trim().slice(0, 200) : '';
      const result = await activityApi.checkIn({
        branchId,
        phoneNumber: displayPhone,
        ...(nameStr ? { customerName: nameStr } : {}),
        value: amount.trim() ? Number(amount) : undefined,
      });
      setLastActivityId(result.id);
      setCheckinStatus('PENDING');
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (rewardId: string) => {
    setRedeemingId(rewardId);
    setError('');
    try {
      await rewardsApi.redeem(rewardId);
      const p = await customersApi.getMyProfile();
      setProfile(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Redeem failed');
    } finally {
      setRedeemingId(null);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    clearCustomerToken();
    setProfile(null);
    setPhone('');
    setStep('phone');
  };

  useEffect(() => {
    if (step !== 'checkin' || !branchId || !profile || currentPartnerId != null) return;
    branchesApi
      .get(branchId)
      .then((b) => setCurrentPartnerId(b.partnerId))
      .catch(() => {});
  }, [step, branchId, profile, currentPartnerId]);

  useEffect(() => {
    if (step !== 'done' || !branchId || !lastActivityId) return;
    const socket = createBranchSocket(branchId);
    socketRef.current = socket;
    const handler = (payload: { id: string; status: string }) => {
      if (payload.id !== lastActivityId) return;
      setCheckinStatus(payload.status as 'APPROVED' | 'REJECTED');
      if (payload.status === 'APPROVED' && getCustomerTokenIfPresent()) {
        customersApi.getMyProfile().then(setProfile).catch(() => {});
      }
    };
    socket.on('checkin_updated', handler);
    return () => {
      socket.off('checkin_updated', handler);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [step, branchId, lastActivityId]);

  useEffect(() => {
    if (checkinStatus !== 'APPROVED') return;
    const duration = 2500;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22d3ee', '#2dd4bf', '#fafafa'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22d3ee', '#2dd4bf', '#fafafa'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    const t = setTimeout(() => navigate('/me', { replace: true }), 2200);
    return () => clearTimeout(t);
  }, [checkinStatus, navigate]);

  const partnerIdForBranch = profile?.storesVisited?.find((s) => s.branchId === branchId)?.partnerId ?? currentPartnerId;
  const activeRewardsForStore: Reward[] =
    profile?.customer?.rewards?.filter(
      (r) => r.partnerId === partnerIdForBranch && r.status === 'ACTIVE'
    ) ?? [];

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] px-4">
        <Loader message="Loading…" />
      </div>
    );
  }

  const cardClass = 'rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_30px_-10px_rgba(0,0,0,0.3)]';
  const inputClass = 'w-full min-h-[48px] rounded-xl border border-white/20 bg-black/30 px-4 text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/50 outline-none transition';
  const btnPrimary = 'w-full min-h-[48px] rounded-xl border border-white/40 text-white font-medium hover:bg-white/10 transition disabled:opacity-50';

  return (
    <div className="max-w-md mx-auto pb-20 w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-transparent tracking-tight">Store Check-in</h1>

      {isLoggedIn && (
        <div className="flex items-center justify-between gap-2 mb-4 p-4 rounded-2xl border border-white/10 bg-white/[0.04] min-w-0">
          <p className="text-xs sm:text-sm text-white/60 truncate min-w-0">Signed in as {displayPhone}</p>
          <button type="button" onClick={() => setShowLogoutConfirm(true)} className="text-sm text-cyan-400 font-medium shrink-0 min-h-[44px] flex items-center hover:text-cyan-300 transition touch-manipulation">
            Log out
          </button>
        </div>
      )}

      {step === 'phone' && branchId && getCustomerTokenIfPresent() && (
        <div className="flex justify-center py-6">
          <Loader message="Loading…" useDots />
        </div>
      )}
      {step === 'phone' && branchId && !getCustomerTokenIfPresent() && (
        <form onSubmit={handlePhoneSubmit} className="space-y-5">
          <div className={cardClass}>
            <label className="block text-sm font-medium text-white/70 mb-2">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+15551234567"
              required
              autoComplete="tel"
              className={inputClass}
            />
            {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
            <button type="submit" disabled={loading} className={`${btnPrimary} mt-4`}>
              {loading ? 'Checking…' : 'Continue'}
            </button>
          </div>
        </form>
      )}

      {step === 'otp' && branchId && (
        <form onSubmit={handleOtpSubmit} className="space-y-5">
          <div className={cardClass}>
            {otpMode === 'register' && (
              <div className="mb-4">
                <label htmlFor="register-name" className="block text-sm font-medium text-white/70 mb-2">Your name</label>
                <input
                  id="register-name"
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value.slice(0, 200))}
                  placeholder="e.g. Jane Doe"
                  required
                  autoComplete="name"
                  className={`${inputClass} w-full`}
                  minLength={2}
                  maxLength={200}
                />
                <p className="text-xs text-white/50 mt-1">2–200 characters. This is how the store will see you.</p>
              </div>
            )}
            <p className="text-sm text-white/60 mb-1">Your 4-digit verification code</p>
            {mpin && <p className="text-2xl font-mono font-bold text-cyan-300 tracking-[0.4em] mb-4">{mpin}</p>}
            <label className="block text-sm font-medium text-white/70 mb-2">Enter code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              required
              autoComplete="one-time-code"
              className={`${inputClass} text-center text-lg tracking-widest`}
            />
            {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
            <button type="submit" disabled={loading} className={`${btnPrimary} mt-4`}>
              {loading ? 'Verifying…' : otpMode === 'register' ? 'Complete registration' : 'Verify'}
            </button>
            <button type="button" onClick={() => { setStep('phone'); setError(''); }} className="w-full mt-2 min-h-[44px] rounded-xl text-white/50 text-sm font-medium hover:text-white/80 hover:bg-white/5 transition">
              Change number
            </button>
          </div>
        </form>
      )}

      {step === 'checkin' && (
        <>
          <p className="text-white/60 text-sm mb-4">Check-in as {displayName}</p>
          {activeRewardsForStore.length > 0 && (
            <div className={`${cardClass} mb-4 border-cyan-500/30`}>
              <h2 className="font-semibold bg-gradient-to-r from-cyan-300 to-cyan-200/80 bg-clip-text text-transparent mb-3">Use a reward</h2>
              <ul className="space-y-3">
                {activeRewardsForStore.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-white truncate">{r.partner?.businessName}</span>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!!redeemingId}
                      onClick={() => handleRedeem(r.id)}
                      className="shrink-0 rounded-xl border border-white/30 hover:bg-white/10"
                    >
                      {redeemingId === r.id ? 'Redeeming…' : 'Use reward'}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <form onSubmit={handleCheckIn} className="space-y-5">
            <div className={cardClass}>
              <label className="block text-sm font-medium text-white/70 mb-2">Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(String(e.target.value ?? '').slice(0, 200))}
                placeholder="Your name"
                maxLength={200}
                className={inputClass}
              />
              <label className="block text-sm font-medium text-white/70 mb-2 mt-4">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
              {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
              <button type="submit" disabled={loading} className={`${btnPrimary} mt-4`}>
                {loading ? 'Submitting…' : 'Submit check-in'}
              </button>
            </div>
          </form>
          {!isLoggedIn && (
            <button type="button" onClick={handleStayLoggedIn} className="w-full text-sm text-cyan-400 font-medium mt-2 hover:text-cyan-300 transition">
              Stay logged in for next time
            </button>
          )}
        </>
      )}

      {step === 'done' && (
        <div className={`${cardClass} text-center`}>
          {checkinStatus === null || checkinStatus === 'PENDING' ? (
            <>
              <p className="font-semibold text-emerald-400">Check-in submitted!</p>
              <p className="text-sm text-white/60 mt-1">Staff will verify and approve. Waiting for update…</p>
            </>
          ) : checkinStatus === 'APPROVED' ? (
            <>
              <p className="font-semibold text-emerald-400">Approved!</p>
              <p className="text-sm text-white/60 mt-1">Your visit and points have been updated.</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-rose-400">Rejected</p>
              <p className="text-sm text-white/60 mt-1">Staff declined this check-in.</p>
            </>
          )}
          <button type="button" className={`${btnPrimary} mt-5`} onClick={() => { setStep('checkin'); setAmount(''); setCustomerName(''); setError(''); setLastActivityId(null); setCheckinStatus(null); }}>
            Another check-in
          </button>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Confirm logout">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-[var(--premium-surface)] p-6 shadow-xl animate-scale-in">
            <p className="text-white font-medium text-center mb-5">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 min-h-[44px] rounded-xl border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition btn-interactive"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 min-h-[44px] rounded-xl bg-rose-500/90 text-white text-sm font-semibold hover:bg-rose-400 transition btn-interactive"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
