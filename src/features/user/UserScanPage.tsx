import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  customersApi, activityApi, branchesApi, authApi, rewardsApi, referralsApi,
  setCustomerToken, clearCustomerToken, getCustomerTokenIfPresent,
} from '../../lib/api';
import { REFERRAL_CODE_KEY } from '../../App';
import { normalizeIndianPhone, DEFAULT_PHONE_PREFIX } from '../../lib/phone';
import type { CustomerProfile, Reward, Branch } from '../../lib/api';
import { createBranchSocket } from '../../lib/socket';
import { PhoneInput } from '../../components/PhoneInput';
import { ScanSkeleton } from '../../components/Skeleton';

type Step = 'phone' | 'otp' | 'checkin' | 'done';
type OtpMode = 'register' | 'customerLogin';

// ─── OTP boxes ────────────────────────────────────────────────────────────────
function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleChange = (i: number, ch: string) => {
    const digit = ch.replace(/\D/g, '').slice(-1);
    const arr = value.padEnd(4, ' ').split('');
    arr[i] = digit || ' ';
    const next = arr.join('').trimEnd();
    onChange(next);
    if (digit && i < 3) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted) { onChange(pasted); inputs.current[Math.min(pasted.length, 3)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onFocus={(e) => e.target.select()}
          className="text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-all"
          style={{
            width: 60,
            height: 68,
            fontFamily: "'JetBrains Mono', monospace",
            background: 'var(--bg)',
            borderColor: value[i] ? 'var(--a)' : 'var(--bd)',
            color: 'var(--t)',
            boxShadow: value[i] ? '0 0 0 3px var(--abg)' : 'none',
          }}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}

// ─── Streak ring ──────────────────────────────────────────────────────────────
function StreakRing({ current, threshold }: { current: number; threshold: number }) {
  const pct = threshold > 0 ? Math.min(current / threshold, 1) : 0;
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 96, height: 96 }}>
        <svg width={96} height={96} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={48} cy={48} r={r} fill="none" stroke="var(--bdl)" strokeWidth={7} />
          <circle
            cx={48} cy={48} r={r} fill="none"
            stroke="var(--a)" strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-none" style={{ color: 'var(--t)', fontFamily: "'Inter', sans-serif" }}>{current}</span>
          <span className="text-[10px] font-medium leading-none mt-0.5" style={{ color: 'var(--t3)' }}>/ {threshold}</span>
        </div>
      </div>
      <span className="text-xs font-medium" style={{ color: 'var(--t3)' }}>visits</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function UserScanPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const branchId = storeId ?? '';
  // ref can come from the scan URL (?ref=) OR from localStorage (shared via home link)
  const refCode = searchParams.get('ref') || localStorage.getItem(REFERRAL_CODE_KEY);

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
  const [branch, setBranch] = useState<Branch | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [lastRedeemedCode, setLastRedeemedCode] = useState<string | null>(null);
  const [currentPartnerId, setCurrentPartnerId] = useState<string | null>(null);
  const [lastActivityId, setLastActivityId] = useState<string | null>(null);
  const [checkinStatus, setCheckinStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [resendCooldownUntil, setResendCooldownUntil] = useState(0);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const socketRef = useRef<ReturnType<typeof createBranchSocket> | null>(null);

  // Resend countdown
  useEffect(() => {
    if (resendCooldownUntil <= Date.now()) { setResendSecondsLeft(0); return; }
    const tick = () => { const left = Math.ceil((resendCooldownUntil - Date.now()) / 1000); setResendSecondsLeft(left > 0 ? left : 0); };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [resendCooldownUntil]);

  // Fetch branch info on mount
  useEffect(() => {
    if (!branchId) return;
    branchesApi.get(branchId)
      .then((b) => { setBranch(b); setCurrentPartnerId(b.partnerId); })
      .catch(() => {});
  }, [branchId]);

  // Auto-login if token exists
  useEffect(() => {
    const token = getCustomerTokenIfPresent();
    if (token && branchId) {
      setProfileLoading(true);
      customersApi.getMyProfile()
        .then((p) => {
          setProfile(p); setPhone(p.customer.phoneNumber); setStep('checkin');
          if (p.customer.name?.trim() && !customerName.trim()) setCustomerName(p.customer.name.trim());
          const store = p.storesVisited?.find((s) => s.branchId === branchId);
          if (store?.partnerId) setCurrentPartnerId(store.partnerId);
        })
        .catch(() => { clearCustomerToken(); setStep('phone'); })
        .finally(() => setProfileLoading(false));
    }
  }, [branchId]);

  // isLoggedIn intentionally removed — "stay logged in" button no longer shown
  const displayPhone = profile?.customer?.phoneNumber ?? phone;
  const displayName = profile?.customer?.name?.trim() || customerName.trim() || displayPhone;

  // Branch + profile derived values
  const storeForBranch = profile?.storesVisited?.find((s) => s.branchId === branchId);
  const streakCurrent = storeForBranch?.visitCount ?? 0;
  const threshold = branch?.settings?.streakThreshold ?? storeForBranch?.rewardThreshold ?? 0;
  const rewardDesc = branch?.settings?.rewardDescription || storeForBranch?.rewardDescription || 'Free reward';
  const windowDays = branch?.settings?.rewardWindowDays ?? storeForBranch?.rewardWindowDays ?? 30;
  const loyaltyType = branch?.loyaltyType ?? storeForBranch?.loyaltyType ?? 'VISITS';
  const pointsPct = branch?.settings?.pointsPercentage ?? storeForBranch?.amountPerCoin ?? 0;
  const minCheckInAmount = branch?.settings?.minCheckInAmount ?? null;
  const partnerIdForBranch = storeForBranch?.partnerId ?? currentPartnerId;
  const activeRewardsForStore: Reward[] = profile?.customer?.rewards?.filter(
    (r) => r.partnerId === partnerIdForBranch && r.status === 'ACTIVE',
  ) ?? [];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !branchId) return;
    const normalized = normalizeIndianPhone(phone.trim());
    setError(''); setLoading(true);
    try {
      // Try sending OTP — backend returns skipOtp=true for verified customers
      const res = await authApi.sendOtp(normalized);
      setPhone(normalized);
      if (res.skipOtp) {
        // Existing verified user → auto-login immediately, no button click needed
        await doAutoLogin(normalized);
        return;
      }
      // New user → needs OTP + name
      setMpin(res.otp ?? ''); setOtpMode('register'); setStep('otp'); setOtp(''); setRegisterName(''); setResendCooldownUntil(Date.now() + 60000);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not continue.'); }
    finally { setLoading(false); }
  };

  const doAutoLogin = async (normalized: string) => {
    const loginRes = await authApi.customerLogin(normalized);
    setCustomerToken(loginRes.access_token);
    setProfileLoading(true);
    const p = await customersApi.getMyProfile();
    setProfile(p);
    if (p.customer.name?.trim()) setCustomerName(p.customer.name.trim());
    const store = p.storesVisited?.find((s) => s.branchId === branchId);
    if (store?.partnerId) setCurrentPartnerId(store.partnerId);
    setProfileLoading(false); setStep('checkin');
  };

  const handleResendOtp = async () => {
    if (!phone.trim() || resendCooldownUntil > Date.now()) return;
    setError(''); setLoading(true);
    try {
      const normalized = normalizeIndianPhone(phone.trim());
      const res = await authApi.sendOtp(normalized);
      if (res.skipOtp) { await doAutoLogin(normalized); return; }
      setMpin(res.otp ?? ''); setOtp(''); setResendCooldownUntil(Date.now() + 60000);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not resend code.'); }
    finally { setLoading(false); }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpMode === 'register') {
      const n = registerName.trim();
      if (n.length < 2) { setError('Please enter your name (at least 2 characters)'); return; }
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
        if (store?.partnerId) setCurrentPartnerId(store.partnerId);
        setProfileLoading(false);
      } else {
        const nameToSave = registerName.trim().slice(0, 200);
        const normalizedPhone = normalizeIndianPhone(phone.trim());
        const res = await customersApi.register({ branchId, phoneNumber: normalizedPhone, name: nameToSave, otp: otp.trim() });
        setCustomerToken(res.access_token); setPhone(res.customer.phone); setCustomerName(nameToSave); setStep('checkin');
        // Apply referral code if present (non-blocking — never block registration)
        if (refCode) {
          referralsApi.apply(refCode, normalizedPhone).catch(() => {});
          localStorage.removeItem(REFERRAL_CODE_KEY); // consume once used
        }
      }
    } catch (e) { setError(e instanceof Error ? e.message : otpMode === 'customerLogin' ? 'Invalid code' : 'Registration failed'); }
    finally { setLoading(false); }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amountNum = amount.trim() ? Number(amount) : undefined;
    if (minCheckInAmount != null && minCheckInAmount > 0 && (amountNum == null || amountNum < minCheckInAmount)) {
      setError(`Minimum amount is ₹${minCheckInAmount}.`); return;
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


  // WebSocket for check-in status
  useEffect(() => {
    if (step !== 'done' || !branchId || !lastActivityId) return;
    const socket = createBranchSocket(branchId); socketRef.current = socket;
    const handler = (payload: { id: string; status: string; pointsEarned?: number | null }) => {
      if (payload.id !== lastActivityId) return;
      setCheckinStatus(payload.status as 'APPROVED' | 'REJECTED');
      if (payload.status === 'APPROVED' && payload.pointsEarned && payload.pointsEarned > 0) setPointsEarned(payload.pointsEarned);
      if (payload.status === 'APPROVED' && getCustomerTokenIfPresent()) customersApi.getMyProfile().then(setProfile).catch(() => {});
    };
    socket.on('checkin_updated', handler);
    return () => { socket.off('checkin_updated', handler); socket.disconnect(); socketRef.current = null; };
  }, [step, branchId, lastActivityId]);

  // Auto-redirect to /me 3s after PENDING (staff will approve later)
  useEffect(() => {
    if (step !== 'done' || checkinStatus !== 'PENDING') return;
    const t = setTimeout(() => navigate('/me', { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [step, checkinStatus, navigate]);

  // Confetti + redirect on approval
  useEffect(() => {
    if (checkinStatus !== 'APPROVED') return;
    const duration = 2500; const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#D85A30', '#2A6040', '#A8D4BA'] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#D85A30', '#E4F2EB', '#7B5E54'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    const t = setTimeout(() => navigate('/me', { replace: true }), 2800);
    return () => clearTimeout(t);
  }, [checkinStatus, navigate]);

  // ─── Store header ──────────────────────────────────────────────────────────
  const storeName = branch?.branchName ?? '…';
  const storeInitial = storeName !== '…' ? storeName.charAt(0).toUpperCase() : '?';

  if (profileLoading) {
    return <div className="max-w-md mx-auto w-full min-w-0 px-1 pt-4"><ScanSkeleton /></div>;
  }

  // ─── Shared styles ─────────────────────────────────────────────────────────
  const card = {
    background: 'var(--s)',
    border: '1.5px solid var(--bdl)',
    boxShadow: '0 4px 24px rgba(93,64,55,0.07)',
  } as React.CSSProperties;

  const inputCls = 'w-full min-h-[52px] rounded-2xl border-2 px-4 outline-none transition-all text-sm font-medium';
  const inputStyle = (focused?: boolean) => ({
    borderColor: focused ? 'var(--a)' : 'var(--bd)',
    background: 'var(--bg)',
    color: 'var(--t)',
  } as React.CSSProperties);

  return (
    <div className="max-w-md mx-auto pb-24 w-full min-w-0" style={{ paddingTop: '16px' }}>

      {/* ── Store header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
        {/* Avatar with live ping ring */}
        <div className="relative shrink-0">
          <div
            className="flex items-center justify-center rounded-2xl font-bold text-xl text-white"
            style={{ width: 52, height: 52, background: 'linear-gradient(135deg, var(--a), #E8784E)', boxShadow: '0 4px 14px rgba(216,90,48,0.3)' }}
          >
            {storeInitial}
          </div>
          {/* Live dot */}
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2" style={{ borderColor: 'var(--bg)', background: 'var(--gr)' }}>
            <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full opacity-60" style={{ background: 'var(--gr)' }} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-lg leading-tight truncate" style={{ color: 'var(--t)', letterSpacing: '-0.02em' }}>{storeName}</p>
          {branch ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
              style={{ background: 'var(--abg)', color: 'var(--a)' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 11 }}>
                {loyaltyType === 'VISITS' ? 'confirmation_number' : loyaltyType === 'POINTS' ? 'generating_tokens' : 'sync'}
              </span>
              {loyaltyType === 'VISITS' ? 'Visit rewards' : loyaltyType === 'POINTS' ? 'Points rewards' : 'Hybrid rewards'}
            </span>
          ) : (
            <div className="h-4 w-24 rounded-full mt-1 animate-pulse" style={{ background: 'var(--bdl)' }} />
          )}
        </div>

        {/* Open badge */}
        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'var(--grbg)', border: '1px solid var(--grbd)' }}>
          <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--gr)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--gr)' }}>Open</span>
        </div>
      </div>

      {/* ── PHONE step ───────────────────────────────────────────────────── */}
      {step === 'phone' && !getCustomerTokenIfPresent() && (
        <form onSubmit={handlePhoneSubmit} className="animate-slide-in-up">
          <div className="rounded-3xl p-5" style={card}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--abg)' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--a)' }}>phone_iphone</span>
              </div>
              <div>
                <p className="font-semibold text-base leading-tight" style={{ color: 'var(--t)' }}>Enter your number</p>
                <p className="text-xs" style={{ color: 'var(--t3)' }}>We'll look up your loyalty account</p>
              </div>
            </div>

            {refCode && (
              <div
                className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-2xl text-sm"
                style={{ background: 'var(--abg)', border: '1.5px solid var(--abd)', color: 'var(--a)' }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>card_giftcard</span>
                <span className="font-medium">You were referred by a friend — sign up and both of you earn bonus points!</span>
              </div>
            )}

            <PhoneInput label="Phone number" value={phone} onChange={setPhone} placeholder="98765 43210" required autoComplete="tel" variant="dark" />

            {error && (
              <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl" style={{ background: 'var(--rebg)', color: 'var(--re)' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>error</span>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[52px] mt-4 rounded-2xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--a)', color: '#fff', boxShadow: '0 4px 14px rgba(216,90,48,0.3)' }}
            >
              {loading ? (
                <span className="material-symbols-rounded animate-spin" style={{ fontSize: 20 }}>progress_activity</span>
              ) : (
                <>Continue <span className="material-symbols-rounded" style={{ fontSize: 18 }}>arrow_forward</span></>
              )}
            </button>
          </div>

          {/* Reward preview while not logged in — visits/hybrid only */}
          {branch && (loyaltyType === 'VISITS' || loyaltyType === 'HYBRID') && threshold > 0 && (
            <div
              className="mt-3 rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in-up"
              style={{ background: 'var(--abg)', border: '1.5px solid var(--abd)' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: 'var(--a)' }}>redeem</span>
              <p className="text-sm" style={{ color: 'var(--t)' }}>
                <span className="font-semibold">{threshold} visit{threshold !== 1 ? 's' : ''}</span>
                {windowDays > 0 && <span style={{ color: 'var(--t3)' }}> in {windowDays} days</span>}
                {' → '}
                <span className="font-semibold" style={{ color: 'var(--a)' }}>{rewardDesc}</span>
              </p>
            </div>
          )}
        </form>
      )}

      {/* ── OTP step ─────────────────────────────────────────────────────── */}
      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="animate-slide-in-up">
          <div className="rounded-3xl p-5" style={card}>

            {/* Header */}
            <button type="button" onClick={() => { setStep('phone'); setError(''); }} className="flex items-center gap-1.5 mb-5" style={{ color: 'var(--t3)' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>arrow_back</span>
              <span className="text-sm">{phone}</span>
            </button>

            {otpMode === 'register' && (
              <div className="mb-5">
                <label className="block text-xs font-semibold uppercase tracking-[0.06em] mb-2" style={{ color: 'var(--t2)' }}>Your name</label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value.slice(0, 200))}
                  placeholder="e.g. Arjun Sharma"
                  required
                  autoComplete="name"
                  minLength={2}
                  maxLength={200}
                  className={inputCls}
                  style={inputStyle()}
                />
              </div>
            )}

            <p className="text-sm font-medium text-center mb-1" style={{ color: 'var(--t2)' }}>
              {otpMode === 'register' ? 'Verification code' : 'Enter your code'}
            </p>
            <p className="text-xs text-center mb-4" style={{ color: 'var(--t3)' }}>Sent via SMS to {phone}</p>

            {/* Dev OTP hint */}
            {mpin && (
              <div className="mb-4 py-2 px-3 rounded-xl text-center" style={{ background: 'var(--ambg)' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--am)' }}>Dev code: </span>
                <span className="text-sm font-bold tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--am)' }}>{mpin}</span>
              </div>
            )}

            <OtpBoxes value={otp} onChange={setOtp} />

            {error && (
              <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-xl" style={{ background: 'var(--rebg)', color: 'var(--re)' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>error</span>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full min-h-[52px] mt-5 rounded-2xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--a)', color: '#fff', boxShadow: '0 4px 14px rgba(216,90,48,0.3)' }}
            >
              {loading ? (
                <span className="material-symbols-rounded animate-spin" style={{ fontSize: 20 }}>progress_activity</span>
              ) : otpMode === 'register' ? 'Create account & check in' : 'Verify'}
            </button>

            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || resendSecondsLeft > 0}
                className="flex-1 min-h-[44px] rounded-2xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ color: 'var(--a)', background: 'var(--abg)' }}
              >
                {resendSecondsLeft > 0 ? `Resend (${resendSecondsLeft}s)` : 'Resend code'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── CHECKIN step ─────────────────────────────────────────────────── */}
      {step === 'checkin' && (
        <div className="space-y-3 animate-slide-in-up">

          {/* Greeting */}
          <div className="flex items-center gap-3 px-1 mb-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--a), #E8784E)' }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--t)' }}>Welcome back, {displayName.split(' ')[0]}!</p>
              <p className="text-xs" style={{ color: 'var(--t3)' }}>{displayPhone}</p>
            </div>
          </div>

          {/* Redeemed code */}
          {lastRedeemedCode && (
            <div className="rounded-3xl p-4" style={{ background: 'var(--grbg)', border: '1.5px solid var(--grbd)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--gr)' }}>check_circle</span>
                <p className="text-sm font-semibold" style={{ color: 'var(--gr)' }}>Reward code ready</p>
              </div>
              <p className="text-xs mb-2" style={{ color: 'var(--t2)' }}>Show this to staff for your reward</p>
              <p className="text-3xl font-bold tracking-[0.4em] text-center py-2" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--gr)' }}>
                {lastRedeemedCode}
              </p>
              <button type="button" onClick={() => setLastRedeemedCode(null)} className="text-xs font-medium mt-1" style={{ color: 'var(--t3)' }}>Dismiss</button>
            </div>
          )}

          {/* Streak ring — only for VISITS or HYBRID */}
          {(loyaltyType === 'VISITS' || loyaltyType === 'HYBRID') && threshold > 0 && (
            <div className="rounded-3xl p-5" style={card}>
              <div className="flex items-center gap-4">
                <StreakRing current={streakCurrent} threshold={threshold} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--t)' }}>
                    {streakCurrent >= threshold
                      ? '🎉 Reward ready!'
                      : `${threshold - streakCurrent} more visit${threshold - streakCurrent !== 1 ? 's' : ''} to go`}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--t3)' }}>
                    {windowDays > 0 ? `Within ${windowDays} days` : 'No time limit'}
                    {' · '}
                    <span className="font-semibold" style={{ color: 'var(--a)' }}>{rewardDesc}</span>
                  </p>
                  <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bdl)' }}>
                    <div
                      className="h-full rounded-full animate-progress-fill"
                      style={{
                        width: `${Math.min((streakCurrent / threshold) * 100, 100)}%`,
                        background: streakCurrent >= threshold
                          ? 'linear-gradient(90deg, var(--gr), #3d8a5e)'
                          : 'linear-gradient(90deg, var(--a), #E8784E)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Points card — only for POINTS or HYBRID */}
          {(loyaltyType === 'POINTS' || loyaltyType === 'HYBRID') && (
            <div className="rounded-3xl p-5" style={{ background: 'var(--grbg)', border: '1.5px solid var(--grbd)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(42,96,64,0.15)' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--gr)' }}>generating_tokens</span>
                </div>
                <p className="font-semibold text-sm" style={{ color: 'var(--t)' }}>Points rewards</p>
              </div>
              {pointsPct > 0 ? (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--t2)' }}>
                  Earn{' '}
                  <span className="font-bold" style={{ color: 'var(--gr)' }}>{pointsPct}%</span>
                  {' '}back as points on every ₹ you spend here.
                  {rewardDesc && rewardDesc !== 'Free reward' && (
                    <span> Redeem for <span className="font-semibold" style={{ color: 'var(--gr)' }}>{rewardDesc}</span>.</span>
                  )}
                </p>
              ) : (
                <p className="text-sm" style={{ color: 'var(--t2)' }}>
                  Points are earned on every purchase. Enter your bill amount to earn.
                </p>
              )}
            </div>
          )}

          {/* Active rewards */}
          {activeRewardsForStore.length > 0 && (
            <div className="rounded-3xl p-4" style={card}>
              <p className="text-xs font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'var(--a)' }}>
                {activeRewardsForStore.length} reward{activeRewardsForStore.length !== 1 ? 's' : ''} available
              </p>
              <div className="space-y-2">
                {activeRewardsForStore.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl" style={{ background: 'var(--abg)', border: '1px solid var(--abd)' }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--a)' }}>redeem</span>
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--t)' }}>Free reward</span>
                    </div>
                    <button
                      type="button"
                      disabled={!!redeemingId}
                      onClick={() => handleRedeem(r.id)}
                      className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                      style={{ background: 'var(--a)', color: '#fff' }}
                    >
                      {redeemingId === r.id ? '…' : 'Use now'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Check-in form */}
          <form onSubmit={handleCheckIn}>
            <div className="rounded-3xl p-5" style={card}>
              <label className="block text-xs font-semibold uppercase tracking-[0.06em] mb-2" style={{ color: 'var(--t2)' }}>
                {minCheckInAmount != null && minCheckInAmount > 0 ? `Amount (min ₹${minCheckInAmount})` : 'Amount spent today'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-base" style={{ color: 'var(--t3)' }}>₹</span>
                <input
                  type="number"
                  step="0.01"
                  min={minCheckInAmount ?? 0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={inputCls + ' pl-8'}
                  style={inputStyle(!!amount)}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl" style={{ background: 'var(--rebg)', color: 'var(--re)' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>error</span>
                  <p className="text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[54px] mt-4 rounded-2xl font-semibold text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'var(--a)', color: '#fff', boxShadow: '0 4px 16px rgba(216,90,48,0.35)' }}
              >
                {loading ? (
                  <span className="material-symbols-rounded animate-spin" style={{ fontSize: 22 }}>progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-rounded" style={{ fontSize: 20 }}>qr_code_scanner</span>
                    Check in
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      )}

      {/* ── DONE step ────────────────────────────────────────────────────── */}
      {step === 'done' && (
        <div className="animate-scale-in">
          {(checkinStatus === null || checkinStatus === 'PENDING') && (
            <div className="rounded-3xl p-8 text-center" style={card}>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-soft"
                style={{ background: 'var(--abg)', border: '2px solid var(--abd)' }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 36, color: 'var(--a)' }}>hourglass_top</span>
              </div>
              <p className="text-xl font-bold mb-2" style={{ color: 'var(--t)', letterSpacing: '-0.02em' }}>Check-in submitted!</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--t3)' }}>Staff will approve your visit shortly. You'll be notified when it's done.</p>

              <div className="flex items-center justify-center gap-1.5 mt-6 mb-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-full animate-pulse"
                    style={{ width: 8, height: 8, background: 'var(--a)', animationDelay: `${i * 0.2}s`, opacity: 0.6 }}
                  />
                ))}
              </div>
              <p className="text-xs" style={{ color: 'var(--t3)' }}>Taking you to home…</p>
            </div>
          )}

          {checkinStatus === 'APPROVED' && (
            <div className="rounded-3xl p-8 text-center" style={{ ...card, border: '1.5px solid var(--grbd)' }}>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-success-bounce"
                style={{ background: 'var(--grbg)' }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 40, color: 'var(--gr)' }}>check_circle</span>
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--gr)', letterSpacing: '-0.02em' }}>Approved!</p>
              <p className="text-sm mb-4" style={{ color: 'var(--t3)' }}>Your visit has been recorded</p>
              {pointsEarned && pointsEarned > 0 && (
                <div
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl mb-4"
                  style={{ background: 'var(--abg)', border: '1.5px solid var(--abd)' }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 22, color: 'var(--a)' }}>generating_tokens</span>
                  <span className="text-xl font-bold" style={{ color: 'var(--a)' }}>+{Math.round(pointsEarned)} coins</span>
                </div>
              )}
              <p className="text-xs" style={{ color: 'var(--t3)' }}>Redirecting to your cards…</p>
            </div>
          )}

          {checkinStatus === 'REJECTED' && (
            <div className="rounded-3xl p-8 text-center" style={{ ...card, border: '1.5px solid rgba(176,58,42,0.3)' }}>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--rebg)' }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 40, color: 'var(--re)' }}>cancel</span>
              </div>
              <p className="text-xl font-bold mb-2" style={{ color: 'var(--re)' }}>Check-in declined</p>
              <p className="text-sm mb-6" style={{ color: 'var(--t3)' }}>Staff declined this visit. Please check with them if you think this is a mistake.</p>
              <button
                type="button"
                onClick={() => { setStep('checkin'); setAmount(''); setError(''); setLastActivityId(null); setCheckinStatus(null); setPointsEarned(null); }}
                className="w-full min-h-[52px] rounded-2xl font-semibold text-sm transition-all"
                style={{ background: 'var(--a)', color: '#fff', boxShadow: '0 4px 14px rgba(216,90,48,0.3)' }}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
