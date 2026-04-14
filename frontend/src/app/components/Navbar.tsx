import { Cuboid } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { CinematicThemeSwitcher } from './ui/cinematic-theme-switcher';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 sk-plate rounded-none border-x-0 border-t-0 p-0">
      <div className="max-w-[1920px] mx-auto px-8 h-20 flex items-center justify-between border-b border-divider">
        {/* Logo Section - Machined Chassis */}
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-12 h-12 sk-plate sk-panel flex items-center justify-center border-amber/20 group-hover:border-amber/50 transition-colors">
            <Cuboid className="w-6 h-6 text-amber drop-shadow-[0_0_8px_rgba(255,149,0,0.5)]" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black text-text tracking-widest uppercase">VeloQube</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="sk-indicator text-cyan animate-pulse" />
              <p className="text-[10px] font-bold text-text-tertiary tracking-widest uppercase">Cloud Compiler</p>
            </div>
          </div>
        </Link>

        {/* Console Navigation */}
        {isAuthenticated && user?.role === 'admin' && (
          <div className="flex items-center gap-2 bg-background/20 p-1.5 sk-panel sk-chassis">
            <Link
              to="/workspace"
              className={`px-6 py-2 sk-panel text-[11px] font-black transition-all flex items-center gap-2 ${
                isActive('/workspace') || isActive('/')
                  ? 'sk-plate text-amber'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {(isActive('/workspace') || isActive('/')) && <span className="sk-indicator text-amber" />}
              Workspace
            </Link>
            <Link
              to="/metrics"
              className={`px-6 py-2 sk-panel text-[11px] font-black transition-all flex items-center gap-2 ${
                isActive('/metrics')
                  ? 'sk-plate text-amber'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {isActive('/metrics') && <span className="sk-indicator text-amber" />}
              History
            </Link>
          </div>
        )}

        {/* Control Interface */}
        <div className="flex items-center gap-4">
          {/* Cinematic Theme Toggle */}
          <CinematicThemeSwitcher />

          <div className="h-8 w-px bg-divider mx-2" />

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] font-bold text-text-tertiary tracking-tighter uppercase">Account</span>
                <span className="text-xs font-black text-text">{user?.username || 'User'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2 sk-chassis border-divider text-[11px] font-black text-status-error/80 hover:text-status-error transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="sk-switch px-8 py-2.5 sk-panel text-xs font-black text-cyan"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
