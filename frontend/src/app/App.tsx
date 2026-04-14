import { RouterProvider } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { AppSettingsProvider } from '../context/AppSettingsContext';
import { Toaster } from 'sonner';
import { router } from './routes';

export default function App() {
  return (
    <ThemeProvider>
      <AppSettingsProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--surface)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text)',
              },
            }}
          />
        </AuthProvider>
      </AppSettingsProvider>
    </ThemeProvider>
  );
}
