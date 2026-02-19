import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginPlatform, loginStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      setStep('otp');
      setOtp('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(phone, otp);
      if (res.user && res.access_token) {
        loginPlatform(res.user, res.access_token);
        if (res.user.role === 'SUPER_ADMIN') navigate(from || '/admin/dashboard', { replace: true });
        else navigate(from || '/owner/dashboard', { replace: true });
      } else if (res.staff && res.access_token) {
        loginStaff(res.staff, res.access_token);
        navigate(from || '/seller/dashboard', { replace: true });
      } else {
        setError('Invalid response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-6">
        <h1 className="text-xl font-bold text-center mb-6">Login</h1>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              label="Phone"
              type="tel"
              placeholder="+15550000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Sending…' : 'Send OTP'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <p className="text-sm text-gray-600">Code sent to {phone}</p>
            <Input
              label="OTP"
              type="text"
              placeholder="1111"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              autoComplete="one-time-code"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => { setStep('phone'); setError(''); }}
            >
              Change number
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
