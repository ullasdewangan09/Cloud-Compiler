import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Navbar } from './components/Navbar';
import { Loader2 } from 'lucide-react';

const AUTH_ROUTES = ['/login', '/register'];

export function Layout() {
  const location = useLocation();
  const hideNavbar = AUTH_ROUTES.includes(location.pathname);

  return (
    <div className="relative h-screen flex flex-col overflow-hidden bg-background">
      {!hideNavbar && <Navbar />}
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        <Suspense fallback={
          <div className="flex h-full w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-amber" />
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
