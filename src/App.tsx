import { useEffect } from 'react';
import { BrowserRouter, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PWAProvider } from './contexts/PWAContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppRouter } from './routes/AppRouter';

const REFERRAL_CODE_KEY = 'loyalty_ref';
const REFERRAL_CODE_REGEX = /^[A-Z0-9]{4,10}$/;

// Capture ?ref= immediately at module load — before React renders or Router redirects.
// useEffect fires too late: Navigate replace runs during render and strips the param before effects run.
(function captureRefOnLoad() {
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (ref && REFERRAL_CODE_REGEX.test(ref.trim())) {
    localStorage.setItem(REFERRAL_CODE_KEY, ref.trim());
  }
})();

// No-op component kept for future use (e.g. SPA navigations that add ?ref=)
function ReferralCapture() {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get('ref');
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
