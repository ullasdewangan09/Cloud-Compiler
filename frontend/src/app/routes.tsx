import { Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        lazy: () => import('./pages/LandingPage').then(m => ({ Component: m.LandingPage })),
      },
      {
        path: 'login',
        lazy: () => import('./pages/Login').then(m => ({ Component: m.Login })),
      },
      {
        path: 'register',
        lazy: () => import('./pages/Register').then(m => ({ Component: m.Register })),
      },
      {
        path: 'shared/:shareId',
        lazy: () => import('./pages/SharedProject').then(m => ({ Component: m.SharedProject })),
      },
      {
        path: 'workspace',
        element: <ProtectedRoute children={null} />, // We will handle children below or use lazy.
        children: [
          {
            index: true,
            lazy: () => import('./pages/Workspace').then(m => ({ Component: m.Workspace })),
          },
        ],
      },
      {
        path: 'metrics',
        element: <ProtectedRoute children={null} />,
        children: [
          {
            index: true,
            lazy: () => import('./pages/Metrics').then(m => ({ Component: m.Metrics })),
          },
        ],
      },
      {
        path: 'dashboard',
        element: <ProtectedRoute children={null} />,
        children: [
          {
            index: true,
            lazy: () => import('./pages/Dashboard').then(m => ({ Component: m.Dashboard })),
          },
        ],
      },
    ],
  },
]);
