import { Outlet, useLocation } from 'react-router';
import { Navbar } from './components/Navbar';

export function Layout() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="app-dynamic-bg" aria-hidden="true" />
      <div className="relative z-10 min-h-screen">
        {!hideNavbar && <Navbar />}
        <Outlet />
      </div>
    </div>
  );
}
