import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PWAProvider } from './contexts/PWAContext';
import { AppRouter } from './routes/AppRouter';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PWAProvider>
          <AppRouter />
        </PWAProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
