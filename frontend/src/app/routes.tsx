import { createBrowserRouter, Navigate } from 'react-router';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Workspace } from './pages/Workspace';
import { Metrics } from './pages/Metrics';
import { Dashboard } from './pages/Dashboard';
import { Layout } from './Layout';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/workspace" replace />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'workspace',
        element: (
          <ProtectedRoute>
            <Workspace />
          </ProtectedRoute>
        ),
      },
      {
        path: 'metrics',
        element: (
          <ProtectedRoute>
            <Metrics />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
