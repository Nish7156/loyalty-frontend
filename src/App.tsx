import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PWAProvider } from './contexts/PWAContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppRouter } from './routes/AppRouter';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <PWAProvider>
            <AppRouter />
          </PWAProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
