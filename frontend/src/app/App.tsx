import { RouterProvider } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from 'sonner';
import { router } from './routes';

export default function App() {
  return (
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
  );
}
