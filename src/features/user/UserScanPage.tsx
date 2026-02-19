import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { customersApi, activityApi, branchesApi, authApi, rewardsApi, setCustomerToken, clearCustomerToken, getCustomerTokenIfPresent } from '../../lib/api';
import type { CustomerProfile, Reward } from '../../lib/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

type Step = 'phone' | 'otp' | 'checkin' | 'done';
type OtpMode = 'register' | 'customerLogin';

export function UserScanPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const branchId = storeId || '';
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMode, setOtpMode] = useState<OtpMode>('register');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [currentPartnerId, setCurrentPartnerId] = useState<string | null>(null);

  const isLoggedIn = !!getCustomerTokenIfPresent();
  const displayPhone = profile?.customer?.phoneNumber ?? phone;

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
        await authApi.sendOtp(phone.trim());
        setOtpMode('register');
        setStep('otp');
        setOtp('');
      } catch {
        setOtpMode('register');
        setStep('otp');
        setOtp('');
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
      await authApi.sendOtp(phone.trim());
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
        const res = await customersApi.register({ branchId, phoneNumber: phone.trim(), otp: otp.trim() });
        setCustomerToken(res.access_token);
        setPhone(res.customer.phone);
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
      await activityApi.checkIn({
        branchId,
        phoneNumber: displayPhone,
        value: amount.trim() ? Number(amount) : undefined,
      });
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

  const partnerIdForBranch = profile?.storesVisited?.find((s) => s.branchId === branchId)?.partnerId ?? currentPartnerId;
  const activeRewardsForStore: Reward[] =
    profile?.customer?.rewards?.filter(
      (r) => r.partnerId === partnerIdForBranch && r.status === 'ACTIVE'
    ) ?? [];

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] px-4">
        <p className="text-[var(--premium-muted)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-20">
      <h1 className="text-xl font-bold mb-4 text-[var(--premium-cream)] tracking-tight">Store Check-in</h1>

      {isLoggedIn && (
        <div className="flex items-center justify-between mb-4 p-3 bg-[var(--premium-surface)] rounded-xl border border-[var(--premium-border)]">
          <p className="text-sm text-[var(--premium-muted)]">Signed in as {displayPhone}</p>
          <button type="button" onClick={handleLogout} className="text-sm text-[var(--premium-gold)] hover:underline">
            Log out
          </button>
        </div>
      )}

      {step === 'phone' && branchId && (
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
            {loading ? 'Checking…' : 'Continue'}
          </Button>
        </form>
      )}

      {step === 'otp' && branchId && (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <p className="text-sm text-[var(--premium-muted)]">
            {otpMode === 'customerLogin' ? 'Enter OTP to stay logged in.' : 'New here! OTP sent to '}
            {otpMode === 'register' && <strong>{phone}</strong>}
          </p>
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
            {loading ? 'Verifying…' : otpMode === 'customerLogin' ? 'Log in' : 'Verify & Register'}
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={() => { setStep('phone'); setError(''); }}>
            Change number
          </Button>
        </form>
      )}

      {step === 'checkin' && (
        <>
          <p className="text-[var(--premium-muted)] mb-3">Check-in as {displayPhone}</p>
          {activeRewardsForStore.length > 0 && (
            <div className="bg-[var(--premium-card)] border border-[var(--premium-gold-dim)] rounded-xl p-4 mb-4">
              <h2 className="font-semibold text-[var(--premium-gold)] mb-2">Use a reward</h2>
              <ul className="space-y-2">
                {activeRewardsForStore.map((r) => (
                  <li key={r.id} className="flex items-center justify-between">
                    <span className="text-sm text-[var(--premium-cream)]">{r.partner?.businessName}</span>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!!redeemingId}
                      onClick={() => handleRedeem(r.id)}
                    >
                      {redeemingId === r.id ? 'Redeeming…' : 'Use reward'}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <form onSubmit={handleCheckIn} className="space-y-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            {error && <p className="text-rose-400 text-sm">{error}</p>}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Submitting…' : 'Submit check-in'}
            </Button>
          </form>
          {!isLoggedIn && (
            <button type="button" onClick={handleStayLoggedIn} className="w-full text-sm text-[var(--premium-gold)] mt-2 hover:underline">
              Stay logged in for next time
            </button>
          )}
        </>
      )}

      {step === 'done' && (
        <div className="bg-[var(--premium-card)] border border-emerald-700/50 rounded-xl p-4 text-center">
          <p className="font-medium text-emerald-400">Check-in submitted!</p>
          <p className="text-sm text-[var(--premium-muted)] mt-1">Staff will verify and approve.</p>
          <Button className="mt-4" onClick={() => { setStep('checkin'); setAmount(''); setError(''); }}>
            Another check-in
          </Button>
        </div>
      )}
    </div>
  );
}
