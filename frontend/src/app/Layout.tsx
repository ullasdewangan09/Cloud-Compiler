import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Navbar } from './components/Navbar';

export function Layout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const hideNavbar = isLanding || location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {!isLanding && <div className="app-dynamic-bg" aria-hidden="true" />}
      <div className="relative z-10 min-h-screen">
        {!hideNavbar && <Navbar />}
        <Suspense fallback={
          <div className="flex h-screen w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky border-t-transparent" />
          </div>
        }>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
