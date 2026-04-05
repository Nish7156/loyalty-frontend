import { useEffect } from 'react';
import { BrowserRouter, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PWAProvider } from './contexts/PWAContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppRouter } from './routes/AppRouter';

const REFERRAL_CODE_KEY = 'loyalty_ref';

// Capture ?ref= from any URL and persist in localStorage for use at registration
const REFERRAL_CODE_REGEX = /^[A-Z0-9]{4,10}$/;

function ReferralCapture() {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get('ref');
    // Only store clean referral codes — ignore garbage like full share text pasted as URL
    if (ref && REFERRAL_CODE_REGEX.test(ref.trim())) {
      localStorage.setItem(REFERRAL_CODE_KEY, ref.trim());
    }
  }, [searchParams]);
  return null;
}

export { REFERRAL_CODE_KEY };

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <PWAProvider>
            <NotificationProvider>
              <ReferralCapture />
              <AppRouter />
            </NotificationProvider>
          </PWAProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
