import { useEffect } from 'react';
import { BrowserRouter, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PWAProvider } from './contexts/PWAContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppRouter } from './routes/AppRouter';

const REFERRAL_CODE_KEY = 'loyalty_ref';

// Capture ?ref= from any URL and persist in localStorage for use at registration
function ReferralCapture() {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      localStorage.setItem(REFERRAL_CODE_KEY, ref);
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
