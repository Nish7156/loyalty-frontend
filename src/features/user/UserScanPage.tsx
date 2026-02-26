import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { customersApi, activityApi, branchesApi, authApi, rewardsApi, setCustomerToken, clearCustomerToken, getCustomerTokenIfPresent } from '../../lib/api';
import { normalizeIndianPhone, DEFAULT_PHONE_PREFIX } from '../../lib/phone';
import type { CustomerProfile, Reward } from '../../lib/api';
import { createBranchSocket } from '../../lib/socket';
import { Button } from '../../components/Button';
import { PhoneInput } from '../../components/PhoneInput';
import { ScanSkeleton } from '../../components/Skeleton';

type Step = 'phone' | 'otp' | 'checkin' | 'done';
type OtpMode = 'register' | 'customerLogin';

export function UserScanPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const branchId = storeId || '';
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState(DEFAULT_PHONE_PREFIX);
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
  const [lastRedeemedCode, setLastRedeemedCode] = useState<string | null>(null);
  const [currentPartnerId, setCurrentPartnerId] = useState<string | null>(null);
  const [lastActivityId, setLastActivityId] = useState<string | null>(null);
  const [checkinStatus, setCheckinStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [minCheckInAmount, setMinCheckInAmount] = useState<number | null>(null);
  const [resendCooldownUntil, setResendCooldownUntil] = useState(0);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const socketRef = useRef<ReturnType<typeof createBranchSocket> | null>(null);

  useEffect(() => {
    if (resendCooldownUntil <= Date.now()) {
      setResendSecondsLeft(0);
      return;
    }
    const tick = () => {
      const left = Math.ceil((resendCooldownUntil - Date.now()) / 1000);
      setResendSecondsLeft(left > 0 ? left : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [resendCooldownUntil, step]);

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
    const normalized = normalizeIndianPhone(phone.trim());
    setError('');
    setLoading(true);
    try {
      await customersApi.getByPhone(normalized);
      setPhone(normalized);
      setStep('checkin');
    } catch {
      try {
        const res = await authApi.sendOtp(normalized);
        setPhone(normalized);
        setMpin(res.otp ?? '');
        setOtpMode('register');
        setStep('otp');
        setOtp('');
        setRegisterName('');
        setResendCooldownUntil(Date.now() + 60000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not send verification code. Try again.');
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
      const normalized = normalizeIndianPhone(phone.trim());
      const res = await authApi.sendOtp(normalized);
      setMpin(res.otp ?? '');
      setOtpMode('customerLogin');
      setStep('otp');
      setOtp('');
      setResendCooldownUntil(Date.now() + 60000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!phone.trim() || resendCooldownUntil > Date.now()) return;
    setError('');
    setLoading(true);
    try {
      const normalized = normalizeIndianPhone(phone.trim());
      const res = await authApi.sendOtp(normalized);
      setMpin(res.otp ?? '');
      setOtp('');
      setResendCooldownUntil(Date.now() + 60000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resend code. Try again.');
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
        const normalized = normalizeIndianPhone(phone.trim());
        const res = await authApi.customerLogin(normalized, otp.trim());
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
          phoneNumber: normalizeIndianPhone(phone.trim()),
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
    const amountNum = amount.trim() ? Number(amount) : undefined;
    if (minCheckInAmount != null && minCheckInAmount > 0 && (amountNum == null || amountNum < minCheckInAmount)) {
      setError(`Minimum amount for this store is ${minCheckInAmount}. Enter at least ${minCheckInAmount} or leave amount empty.`);
      return;
    }
    setLoading(true);
    try {
      const nameStr = (profile?.customer?.name ?? '').trim().slice(0, 200);
      const result = await activityApi.checkIn({
        branchId,
        phoneNumber: displayPhone,
        ...(nameStr ? { customerName: nameStr } : {}),
        value: amountNum,
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
    setLastRedeemedCode(null);
    try {
      const redeemed = await rewardsApi.redeem(rewardId);
      const p = await customersApi.getMyProfile();
      setProfile(p);
      if (redeemed.redemptionCode) setLastRedeemedCode(redeemed.redemptionCode);
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
    setPhone(DEFAULT_PHONE_PREFIX);
    setStep('phone');
  };

  useEffect(() => {
    if (step !== 'checkin' || !branchId || !profile) return;
    branchesApi
      .get(branchId)
      .then((b) => {
        setCurrentPartnerId(b.partnerId);
        const min = (b.settings as { minCheckInAmount?: number } | undefined)?.minCheckInAmount;
        setMinCheckInAmount(min != null && typeof min === 'number' && min >= 0 ? min : null);
      })
      .catch(() => {});
  }, [step, branchId, profile]);

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
      <div className="max-w-md mx-auto w-full min-w-0 px-4">
        <ScanSkeleton />
      </div>
    );
  }

  const cardClass = 'user-card rounded-2xl p-5 shadow-[0_0_30px_-10px_rgba(0,0,0,0.15)]';
  const inputClass = 'w-full min-h-[48px] rounded-xl border px-4 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/50 outline-none transition';
  const btnPrimary = 'hover-user-bg w-full min-h-[48px] rounded-xl border font-medium transition disabled:opacity-50';

  return (
    <div className="max-w-md mx-auto pb-20 w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent tracking-tight">Store Check-in</h1>

      {isLoggedIn && (
        <div className="user-card flex items-center justify-between gap-2 mb-4 p-4 rounded-2xl min-w-0">
          <p className="text-xs sm:text-sm user-text-muted truncate min-w-0">Signed in as {displayPhone}</p>
          <button type="button" onClick={() => setShowLogoutConfirm(true)} className="text-sm text-cyan-500 font-medium shrink-0 min-h-[44px] flex items-center hover:text-cyan-400 transition touch-manipulation">
            Log out
          </button>
        </div>
      )}

      {step === 'phone' && branchId && getCustomerTokenIfPresent() && (
        <div className="max-w-md mx-auto w-full min-w-0">
          <ScanSkeleton />
        </div>
      )}
      {step === 'phone' && branchId && !getCustomerTokenIfPresent() && (
        <form onSubmit={handlePhoneSubmit} className="space-y-5">
          <div className={cardClass}>
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
            <button type="submit" disabled={loading} className={`${btnPrimary} mt-4`} style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}>
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
                <label htmlFor="register-name" className="block text-sm font-medium user-text-muted mb-2">Your name</label>
                <input
                  id="register-name"
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value.slice(0, 200))}
                  placeholder="e.g. Jane Doe"
                  required
                  autoComplete="name"
                  className={`${inputClass} w-full`}
                  style={{ borderColor: 'var(--user-border-subtle)', backgroundColor: 'var(--user-input-bg)', color: 'var(--user-text)' }}
                  minLength={2}
                  maxLength={200}
                />
                <p className="text-xs user-text-subtle mt-1">2–200 characters. This is how the store will see you.</p>
              </div>
            )}
            <p className="text-sm user-text-muted mb-1">Your 4-digit verification code</p>
            {mpin && <p className="text-2xl font-mono font-bold text-cyan-500 tracking-[0.4em] mb-4">{mpin}</p>}
            <label className="block text-sm font-medium user-text-muted mb-2">Enter code</label>
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
              style={{ borderColor: 'var(--user-border-subtle)', backgroundColor: 'var(--user-input-bg)', color: 'var(--user-text)' }}
            />
            {error && <p className="text-rose-500 text-sm mt-2">{error}</p>}
            <button type="submit" disabled={loading} className={`${btnPrimary} mt-4`} style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}>
              {loading ? 'Verifying…' : otpMode === 'register' ? 'Complete registration' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading || resendSecondsLeft > 0}
              className="hover-user-bg w-full mt-2 min-h-[44px] rounded-xl text-cyan-500 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendSecondsLeft > 0 ? `Resend code (${resendSecondsLeft}s)` : 'Resend code'}
            </button>
            <button type="button" onClick={() => { setStep('phone'); setError(''); }} className="hover-user-bg w-full mt-1 min-h-[44px] rounded-xl user-text-subtle text-sm font-medium transition">
              Change number
            </button>
          </div>
        </form>
      )}

      {step === 'checkin' && (
        <>
          <p className="user-text-muted text-sm mb-4">Check-in as {displayName}</p>
          {(() => {
            const storeForBranch = profile?.storesVisited?.find((s) => s.branchId === branchId);
            const threshold = storeForBranch?.rewardThreshold ?? 0;
            const windowDays = storeForBranch?.rewardWindowDays ?? 30;
            const rewardDesc = storeForBranch?.rewardDescription || 'Free reward';
            if (threshold > 0 && windowDays > 0) {
              return (
                <div className="mb-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-cyan-300/90">What you win here</p>
                  <p className="text-sm user-text mt-0.5">
                    {threshold} visit{threshold !== 1 ? 's' : ''} in {windowDays} days → <span className="font-semibold text-cyan-200">{rewardDesc}</span>
                  </p>
                </div>
              );
            }
            return null;
          })()}
          {lastRedeemedCode && (
            <div className={`${cardClass} mb-4 border-emerald-500/40 bg-emerald-500/10`}>
              <p className="text-sm user-text mb-1">Your reward code — show this to staff</p>
              <p className="text-2xl font-mono font-bold tracking-[0.3em] text-emerald-500">{lastRedeemedCode}</p>
              <p className="text-xs user-text-subtle mt-2">Staff will enter this code to mark your reward as given.</p>
              <button type="button" onClick={() => setLastRedeemedCode(null)} className="mt-3 text-sm text-cyan-600 font-medium hover:text-cyan-500">
                Dismiss
              </button>
            </div>
          )}
          {activeRewardsForStore.length > 0 && (
            <div className={`${cardClass} mb-4 border-cyan-500/30`}>
              <h2 className="font-semibold bg-gradient-to-r from-cyan-300 to-cyan-200/80 bg-clip-text text-transparent mb-3">Use a reward</h2>
              <ul className="space-y-3">
                {activeRewardsForStore.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm user-text truncate">{r.partner?.businessName}</span>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!!redeemingId}
                      onClick={() => handleRedeem(r.id)}
                      className="shrink-0 rounded-xl hover-user-bg"
                      style={{ borderColor: 'var(--user-border-subtle)' }}
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
              <label className="block text-sm font-medium user-text-muted mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                min={minCheckInAmount ?? 0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={inputClass}
                style={{ borderColor: 'var(--user-border-subtle)', backgroundColor: 'var(--user-input-bg)', color: 'var(--user-text)' }}
              />
              {minCheckInAmount != null && minCheckInAmount > 0 && (
                <p className="user-text-subtle text-xs mt-1">Minimum amount for this store: {minCheckInAmount}. Below that, check-in won&apos;t be accepted.</p>
              )}
              {error && <p className="text-rose-500 text-sm mt-2">{error}</p>}
              <button type="submit" disabled={loading} className={`${btnPrimary} mt-4`} style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}>
                {loading ? 'Submitting…' : 'Submit check-in'}
              </button>
            </div>
          </form>
          {!isLoggedIn && (
            <button type="button" onClick={handleStayLoggedIn} className="w-full text-sm text-cyan-500 font-medium mt-2 hover:text-cyan-400 transition">
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
              <p className="text-sm user-text-muted mt-1">Staff will verify and approve. Waiting for update…</p>
            </>
          ) : checkinStatus === 'APPROVED' ? (
            <>
              <p className="font-semibold text-emerald-500">Approved!</p>
              <p className="text-sm user-text-muted mt-1">Your visit and points have been updated.</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-rose-500">Rejected</p>
              <p className="text-sm user-text-muted mt-1">Staff declined this check-in.</p>
            </>
          )}
          <button type="button" className={`${btnPrimary} mt-5`} style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }} onClick={() => { setStep('checkin'); setAmount(''); setError(''); setLastActivityId(null); setCheckinStatus(null); }}>
            Another check-in
          </button>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Confirm logout">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'var(--user-overlay)' }} aria-hidden="true" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border p-6 shadow-xl animate-scale-in" style={{ borderColor: 'var(--user-border-subtle)', backgroundColor: 'var(--user-surface)' }}>
            <p className="user-text font-medium text-center mb-5">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="hover-user-bg flex-1 min-h-[44px] rounded-xl border text-sm font-medium transition btn-interactive"
                style={{ borderColor: 'var(--user-border-subtle)', color: 'var(--user-text)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 min-h-[44px] rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-400 transition btn-interactive"
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
