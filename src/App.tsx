import { useEffect } from 'react';
import { BrowserRouter, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PWAProvider } from './contexts/PWAContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppRouter } from './routes/AppRouter';

const REFERRAL_CODE_KEY = 'loyalty_ref';
const REFERRAL_CODE_REGEX = /^[A-Z0-9]{4,10}$/;

// ?ref= is captured in index.html <script> before React loads.
// This component handles SPA navigations that add ?ref= without a page reload.
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
