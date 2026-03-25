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
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [minCheckInAmount, setMinCheckInAmount] = useState<number | null>(null);
  const [resendCooldownUntil, setResendCooldownUntil] = useState(0);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const socketRef = useRef<ReturnType<typeof createBranchSocket> | null>(null);

  useEffect(() => {
    if (resendCooldownUntil <= Date.now()) { setResendSecondsLeft(0); return; }
    const tick = () => { const left = Math.ceil((resendCooldownUntil - Date.now()) / 1000); setResendSecondsLeft(left > 0 ? left : 0); };
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
      customersApi.getMyProfile()
        .then((p) => { setProfile(p); setPhone(p.customer.phoneNumber); setStep('checkin'); if (p.customer.name?.trim() && !customerName.trim()) setCustomerName(p.customer.name.trim()); const store = p.storesVisited?.find((s) => s.branchId === branchId); setCurrentPartnerId(store?.partnerId ?? null); })
        .catch(() => { clearCustomerToken(); setStep('phone'); })
        .finally(() => setProfileLoading(false));
    } else if (!token && branchId) { setStep('phone'); }
  }, [branchId]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !branchId) return;
    const normalized = normalizeIndianPhone(phone.trim());
    setError(''); setLoading(true);
    try {
      await customersApi.getByPhone(normalized);
      setPhone(normalized); setStep('checkin');
    } catch {
      try {
        const res = await authApi.sendOtp(normalized);
        setPhone(normalized);
        if (res.skipOtp) {
          const loginRes = await authApi.customerLogin(normalized);
          setCustomerToken(loginRes.access_token);
          setProfileLoading(true);
          const p = await customersApi.getMyProfile();
          setProfile(p);
          if (p.customer.name?.trim()) setCustomerName(p.customer.name.trim());
          const store = p.storesVisited?.find((s) => s.branchId === branchId);
          setCurrentPartnerId(store?.partnerId ?? null);
          setProfileLoading(false); setStep('checkin'); return;
        }
        setMpin(res.otp ?? ''); setOtpMode('register'); setStep('otp'); setOtp(''); setRegisterName(''); setResendCooldownUntil(Date.now() + 60000);
      } catch (err) { setError(err instanceof Error ? err.message : 'Could not send verification code.'); }
    } finally { setLoading(false); }
  };

  const handleStayLoggedIn = async () => {
    if (!phone.trim()) return;
    setError(''); setLoading(true);
    try {
      const normalized = normalizeIndianPhone(phone.trim());
      const res = await authApi.sendOtp(normalized);
      if (res.skipOtp) {
        const loginRes = await authApi.customerLogin(normalized);
        setCustomerToken(loginRes.access_token);
        setProfileLoading(true);
        const p = await customersApi.getMyProfile();
        setProfile(p);
        if (p.customer.name?.trim()) setCustomerName(p.customer.name.trim());
        const store = p.storesVisited?.find((s) => s.branchId === branchId);
        setCurrentPartnerId(store?.partnerId ?? null);
        setProfileLoading(false); setStep('checkin'); return;
      }
      setMpin(res.otp ?? ''); setOtpMode('customerLogin'); setStep('otp'); setOtp(''); setResendCooldownUntil(Date.now() + 60000);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send verification code.'); }
    finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (!phone.trim() || resendCooldownUntil > Date.now()) return;
    setError(''); setLoading(true);
    try {
      const normalized = normalizeIndianPhone(phone.trim());
      const res = await authApi.sendOtp(normalized);
      if (res.skipOtp) {
        const loginRes = await authApi.customerLogin(normalized);
        setCustomerToken(loginRes.access_token);
        setProfileLoading(true);
        const p = await customersApi.getMyProfile();
        setProfile(p);
        if (p.customer.name?.trim()) setCustomerName(p.customer.name.trim());
        const store = p.storesVisited?.find((s) => s.branchId === branchId);
        setCurrentPartnerId(store?.partnerId ?? null);
        setProfileLoading(false); setStep('checkin'); return;
      }
      setMpin(res.otp ?? ''); setOtp(''); setResendCooldownUntil(Date.now() + 60000);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not resend code.'); }
    finally { setLoading(false); }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpMode === 'register') {
      const nameTrimmed = registerName.trim();
      if (nameTrimmed.length < 2) { setError('Please enter your name (at least 2 characters)'); return; }
      if (nameTrimmed.length > 200) { setError('Name must be at most 200 characters'); return; }
    }
    setError(''); setLoading(true);
    try {
      if (otpMode === 'customerLogin') {
        const normalized = normalizeIndianPhone(phone.trim());
        const res = await authApi.customerLogin(normalized, otp.trim());
        setCustomerToken(res.access_token); setPhone(res.customer.phone); setStep('checkin');
        setProfileLoading(true);
        const p = await customersApi.getMyProfile();
        setProfile(p);
        if (p.customer.name?.trim()) setCustomerName(p.customer.name.trim());
        const store = p.storesVisited?.find((s) => s.branchId === branchId);
        setCurrentPartnerId(store?.partnerId ?? null);
        setProfileLoading(false);
      } else {
        const nameToSave = registerName.trim().slice(0, 200);
        const res = await customersApi.register({ branchId, phoneNumber: normalizeIndianPhone(phone.trim()), name: nameToSave, otp: otp.trim() });
        setCustomerToken(res.access_token); setPhone(res.customer.phone); setCustomerName(nameToSave); setStep('checkin');
      }
    } catch (e) { setError(e instanceof Error ? e.message : otpMode === 'customerLogin' ? 'Invalid OTP' : 'Registration failed'); }
    finally { setLoading(false); }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amountNum = amount.trim() ? Number(amount) : undefined;
    if (minCheckInAmount != null && minCheckInAmount > 0 && (amountNum == null || amountNum < minCheckInAmount)) {
      setError(`Minimum amount is ${minCheckInAmount}.`); return;
    }
    setLoading(true);
    try {
      const nameStr = (profile?.customer?.name ?? '').trim().slice(0, 200);
      const result = await activityApi.checkIn({ branchId, phoneNumber: displayPhone, ...(nameStr ? { customerName: nameStr } : {}), value: amountNum });
      setLastActivityId(result.id); setCheckinStatus('PENDING'); setStep('done');
    } catch (e) { setError(e instanceof Error ? e.message : 'Check-in failed'); }
    finally { setLoading(false); }
  };

  const handleRedeem = async (rewardId: string) => {
    setRedeemingId(rewardId); setError(''); setLastRedeemedCode(null);
    try {
      const redeemed = await rewardsApi.redeem(rewardId);
      if (redeemed.redemptionCode) setLastRedeemedCode(redeemed.redemptionCode);
      const p = await customersApi.getMyProfile(); setProfile(p);
    } catch (e) { setError(e instanceof Error ? e.message : 'Redeem failed'); }
    finally { setRedeemingId(null); }
  };

  const handleLogout = () => { setShowLogoutConfirm(false); clearCustomerToken(); setProfile(null); setPhone(DEFAULT_PHONE_PREFIX); setStep('phone'); };

  useEffect(() => {
    if (step !== 'checkin' || !branchId || !profile) return;
    branchesApi.get(branchId).then((b) => { setCurrentPartnerId(b.partnerId); const min = (b.settings as { minCheckInAmount?: number } | undefined)?.minCheckInAmount; setMinCheckInAmount(min != null && typeof min === 'number' && min >= 0 ? min : null); }).catch(() => {});
  }, [step, branchId, profile]);

  useEffect(() => {
    if (step !== 'done' || !branchId || !lastActivityId) return;
    const socket = createBranchSocket(branchId); socketRef.current = socket;
    const handler = (payload: { id: string; status: string; pointsEarned?: number | null }) => {
      if (payload.id !== lastActivityId) return;
      setCheckinStatus(payload.status as 'APPROVED' | 'REJECTED');
      if (payload.status === 'APPROVED') {
        // Read coins earned directly from socket payload (avoids timing race)
        if (payload.pointsEarned && payload.pointsEarned > 0) {
          setPointsEarned(payload.pointsEarned);
        }
        // Refresh profile in background
        if (getCustomerTokenIfPresent()) {
          customersApi.getMyProfile().then(setProfile).catch(() => {});
        }
      }
    };
    socket.on('checkin_updated', handler);
    return () => { socket.off('checkin_updated', handler); socket.disconnect(); socketRef.current = null; };
  }, [step, branchId, lastActivityId]);

  useEffect(() => {
    if (checkinStatus !== 'APPROVED') return;
    const duration = 2500; const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#D85A30', '#2A6040', '#A8D4BA'] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#D85A30', '#E4F2EB', '#7B5E54'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    const t = setTimeout(() => navigate('/me', { replace: true }), 2200);
    return () => clearTimeout(t);
  }, [checkinStatus, navigate]);

  const partnerIdForBranch = profile?.storesVisited?.find((s) => s.branchId === branchId)?.partnerId ?? currentPartnerId;
  const activeRewardsForStore: Reward[] = profile?.customer?.rewards?.filter((r) => r.partnerId === partnerIdForBranch && r.status === 'ACTIVE') ?? [];

  if (profileLoading) {
    return <div className="max-w-md mx-auto w-full min-w-0 px-4"><ScanSkeleton /></div>;
  }

  const cardStyle = { background: 'var(--s)', border: '1px solid var(--bdl)', boxShadow: '0 4px 24px rgba(93,64,55,0.07)' };
  const inputStyle = { borderColor: 'var(--bd)', backgroundColor: 'var(--bg)', color: 'var(--t)' };
  const btnStyle = { background: 'var(--a)', color: 'var(--s)', fontSize: '15px' };

  return (
    <div className="max-w-md mx-auto pb-20 w-full min-w-0" style={{ paddingTop: '20px' }}>
      <h1 className="text-[22px] font-bold mb-3 a1" style={{ color: 'var(--t)', letterSpacing: '-0.02em' }}>Store Check-in</h1>

      {isLoggedIn && (
        <div className="flex items-center justify-between gap-2 mb-4 p-4 rounded-2xl" style={{ ...cardStyle }}>
          <p className="text-xs truncate min-w-0" style={{ color: 'var(--t2)' }}>Signed in as {displayPhone}</p>
          <button type="button" onClick={() => setShowLogoutConfirm(true)} className="text-sm font-medium shrink-0 min-h-[44px] flex items-center" style={{ color: 'var(--a)' }}>
            Log out
          </button>
        </div>
      )}

      {step === 'phone' && branchId && getCustomerTokenIfPresent() && (
        <div className="max-w-md mx-auto w-full min-w-0"><ScanSkeleton /></div>
      )}

      {step === 'phone' && branchId && !getCustomerTokenIfPresent() && (
        <form onSubmit={handlePhoneSubmit} className="space-y-5 a2">
          <div className="rounded-2xl p-5" style={cardStyle}>
            <PhoneInput label="Phone" value={phone} onChange={setPhone} placeholder="98765 43210" required autoComplete="tel" variant="dark" />
            {error && <p className="text-sm mt-2" style={{ color: 'var(--re)' }}>{error}</p>}
            <button type="submit" disabled={loading} className="w-full min-h-[52px] mt-4 rounded-xl font-semibold transition disabled:opacity-50" style={btnStyle}>
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </div>
        </form>
      )}

      {step === 'otp' && branchId && (
        <form onSubmit={handleOtpSubmit} className="space-y-5 a2">
          <div className="rounded-2xl p-5" style={cardStyle}>
            {otpMode === 'register' && (
              <div className="mb-4">
                <label htmlFor="register-name" className="block text-xs font-medium uppercase tracking-[0.02em] mb-2" style={{ color: 'var(--t2)' }}>Your name</label>
                <input id="register-name" type="text" value={registerName} onChange={(e) => setRegisterName(e.target.value.slice(0, 200))} placeholder="e.g. Jane Doe" required autoComplete="name"
                  className="w-full min-h-[50px] rounded-xl border px-4 outline-none transition" style={inputStyle} minLength={2} maxLength={200} />
                <p className="text-[11px] mt-1" style={{ color: 'var(--t3)' }}>2-200 characters. This is how the store will see you.</p>
              </div>
            )}
            <p className="text-sm mb-1" style={{ color: 'var(--t2)' }}>Your 4-digit verification code</p>
            {mpin && <p className="text-2xl font-bold tracking-[0.4em] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--a)' }}>{mpin}</p>}
            <label className="block text-xs font-medium uppercase tracking-[0.02em] mb-2" style={{ color: 'var(--t2)' }}>Enter code</label>
            <input type="text" inputMode="numeric" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" required autoComplete="one-time-code"
              className="w-full min-h-[50px] rounded-xl border px-4 outline-none transition text-center text-lg tracking-widest"
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", boxShadow: otp ? '0 0 0 3px var(--bdl)' : 'none', borderColor: otp ? 'var(--a)' : 'var(--bd)' }} />
            {error && <p className="text-sm mt-2" style={{ color: 'var(--re)' }}>{error}</p>}
            <button type="submit" disabled={loading} className="w-full min-h-[52px] mt-4 rounded-xl font-semibold transition disabled:opacity-50" style={btnStyle}>
              {loading ? 'Verifying...' : otpMode === 'register' ? 'Complete registration' : 'Verify'}
            </button>
            <button type="button" onClick={handleResendOtp} disabled={loading || resendSecondsLeft > 0}
              className="w-full mt-2 min-h-[44px] rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed" style={{ color: 'var(--a)' }}>
              {resendSecondsLeft > 0 ? `Resend code (${resendSecondsLeft}s)` : 'Resend code'}
            </button>
            <button type="button" onClick={() => { setStep('phone'); setError(''); }} className="w-full mt-1 min-h-[44px] rounded-xl text-sm font-medium transition" style={{ color: 'var(--t3)' }}>
              Change number
            </button>
          </div>
        </form>
      )}

      {step === 'checkin' && (
        <>
          <p className="text-sm mb-4" style={{ color: 'var(--t2)' }}>Check-in as {displayName}</p>
          {(() => {
            const storeForBranch = profile?.storesVisited?.find((s) => s.branchId === branchId);
            const threshold = storeForBranch?.rewardThreshold ?? 0;
            const windowDays = storeForBranch?.rewardWindowDays ?? 30;
            const rewardDesc = storeForBranch?.rewardDescription || 'Free reward';
            if (threshold > 0 && windowDays > 0) {
              return (
                <div className="mb-4 rounded-xl px-4 py-3" style={{ background: 'var(--bdl)', border: '1px solid var(--bd)' }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--a)' }}>What you win here</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--t)' }}>
                    {threshold} visit{threshold !== 1 ? 's' : ''} in {windowDays} days → <span className="font-semibold" style={{ color: 'var(--a)' }}>{rewardDesc}</span>
                  </p>
                </div>
              );
            }
            return null;
          })()}
          {(() => {
            const storeForBranch = profile?.storesVisited?.find((s) => s.branchId === branchId);
            const lt = storeForBranch?.loyaltyType || 'VISITS';
            if ((lt === 'POINTS' || lt === 'HYBRID') && storeForBranch?.amountPerCoin) {
              return (
                <div className="mb-4 rounded-xl px-4 py-3" style={{ background: 'var(--grbg)', border: '1px solid rgba(42,96,64,0.2)' }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--gr)' }}>
                    <span className="material-symbols-rounded mr-0.5" style={{ fontSize: '14px', verticalAlign: 'text-bottom' }}>generating_tokens</span>
                    Coin Rewards
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--t)' }}>
                    Earn <span className="font-semibold" style={{ color: 'var(--gr)' }}>1 coin</span> for every <span className="font-semibold">₹{storeForBranch.amountPerCoin}</span> you spend
                  </p>
                </div>
              );
            }
            return null;
          })()}
          {lastRedeemedCode && (
            <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--grbg)', border: '1.5px solid var(--grbd)' }}>
              <p className="text-sm mb-1" style={{ color: 'var(--t)' }}>Your reward code — show this to staff</p>
              <p className="text-2xl font-bold tracking-[0.3em]" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--gr)' }}>{lastRedeemedCode}</p>
              <p className="text-xs mt-2" style={{ color: 'var(--t2)' }}>Staff will enter this code to mark your reward as given.</p>
              <button type="button" onClick={() => setLastRedeemedCode(null)} className="mt-3 text-sm font-medium" style={{ color: 'var(--a)' }}>Dismiss</button>
            </div>
          )}
          {activeRewardsForStore.length > 0 && (
            <div className="rounded-2xl p-5 mb-4" style={cardStyle}>
              <h2 className="font-semibold mb-3" style={{ color: 'var(--a)' }}>Use a reward</h2>
              <ul className="space-y-3">
                {activeRewardsForStore.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm truncate" style={{ color: 'var(--t)' }}>{r.partner?.businessName}</span>
                    <Button type="button" variant="secondary" disabled={!!redeemingId} onClick={() => handleRedeem(r.id)} className="shrink-0 rounded-lg" style={{ borderColor: 'var(--bd)', color: 'var(--a)' }}>
                      {redeemingId === r.id ? 'Redeeming...' : 'Use reward'}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <form onSubmit={handleCheckIn} className="space-y-5">
            <div className="rounded-2xl p-5" style={cardStyle}>
              <label className="block text-xs font-medium uppercase tracking-[0.02em] mb-2" style={{ color: 'var(--t2)' }}>Amount</label>
              <input type="number" step="0.01" min={minCheckInAmount ?? 0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                className="w-full min-h-[50px] rounded-xl border px-4 outline-none transition" style={inputStyle} />
              {minCheckInAmount != null && minCheckInAmount > 0 && (
                <p className="text-[11px] mt-1" style={{ color: 'var(--t3)' }}>Minimum: {minCheckInAmount}</p>
              )}
              {error && <p className="text-sm mt-2" style={{ color: 'var(--re)' }}>{error}</p>}
              <button type="submit" disabled={loading} className="w-full min-h-[52px] mt-4 rounded-xl font-semibold transition disabled:opacity-50" style={btnStyle}>
                {loading ? 'Submitting...' : 'Submit check-in'}
              </button>
            </div>
          </form>
          {!isLoggedIn && (
            <button type="button" onClick={handleStayLoggedIn} className="w-full text-sm font-medium mt-2 transition" style={{ color: 'var(--a)' }}>
              Stay logged in for next time
            </button>
          )}
        </>
      )}

      {step === 'done' && (
        <div className="rounded-2xl p-5 text-center a2" style={cardStyle}>
          {checkinStatus === null || checkinStatus === 'PENDING' ? (
            <>
              <div className="flex justify-center mb-3">
                <div className="flex items-center justify-center animate-pulse-soft" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bdl)' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '32px', color: 'var(--a)' }}>hourglass_top</span>
                </div>
              </div>
              <p className="font-semibold" style={{ color: 'var(--a)' }}>Waiting for approval</p>
              <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>Staff will verify and approve your check-in.</p>
            </>
          ) : checkinStatus === 'APPROVED' ? (
            <>
              <div className="flex justify-center mb-3">
                <div className="flex items-center justify-center" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--grbg)' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '32px', color: 'var(--gr)' }}>check_circle</span>
                </div>
              </div>
              <p className="font-semibold" style={{ color: 'var(--gr)' }}>Check-in approved!</p>
              {pointsEarned && pointsEarned > 0 ? (
                <div className="mt-3 p-4 rounded-xl" style={{ background: 'var(--bdl)', border: '1px solid var(--bd)' }}>
                  <p className="text-xl font-bold" style={{ color: 'var(--a)' }}>+{pointsEarned.toFixed(0)} coins earned!</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--t2)' }}>Check your wallet to see your balance</p>
                </div>
              ) : (
                <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>Your visit and points have been updated.</p>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-center mb-3">
                <div className="flex items-center justify-center" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--rebg)' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '32px', color: 'var(--re)' }}>cancel</span>
                </div>
              </div>
              <p className="font-semibold" style={{ color: 'var(--re)' }}>Check-in declined</p>
              <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>Staff declined this check-in.</p>
            </>
          )}
          <button type="button" className="w-full min-h-[52px] mt-5 rounded-xl font-semibold transition" style={btnStyle}
            onClick={() => { setStep('checkin'); setAmount(''); setError(''); setLastActivityId(null); setCheckinStatus(null); setPointsEarned(null); }}>
            Another check-in
          </button>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'var(--user-overlay)' }} onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 shadow-xl animate-scale-in" style={{ background: 'var(--s)', border: '1px solid var(--bdl)' }}>
            <p className="font-medium text-center mb-5" style={{ color: 'var(--t)' }}>Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowLogoutConfirm(false)} className="flex-1 min-h-[52px] rounded-xl border text-sm font-medium transition" style={{ borderColor: 'var(--bd)', color: 'var(--t2)' }}>Cancel</button>
              <button type="button" onClick={handleLogout} className="flex-1 min-h-[52px] rounded-xl text-sm font-semibold transition" style={{ background: 'var(--re)', color: 'var(--s)' }}>Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
