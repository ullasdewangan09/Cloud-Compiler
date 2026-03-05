import { Code2, LogOut, Sun, Moon, User, BarChart3 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-card rounded-none border-0 border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky to-sky-deep flex items-center justify-center group-hover:scale-110 transition-transform">
              <Code2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text">Cloud Compiler Studio</h1>
              <p className="text-xs text-text-tertiary">Distributed Execution Platform</p>
            </div>
          </Link>

          {/* Nav Items */}
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <Link
                to="/workspace"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/workspace')
                    ? 'bg-primary/20 text-text'
                    : 'text-text-secondary hover:text-text hover:bg-surface'
                }`}
              >
                Workspace
              </Link>
              <Link
                to="/metrics"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  isActive('/metrics')
                    ? 'bg-primary/20 text-text'
                    : 'text-text-secondary hover:text-text hover:bg-surface'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Metrics
              </Link>
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/dashboard')
                    ? 'bg-primary/20 text-text'
                    : 'text-text-secondary hover:text-text hover:bg-surface'
                }`}
              >
                Dashboard
              </Link>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg hover:bg-surface transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 rounded-lg bg-surface flex items-center gap-2">
                  <User className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm text-text-secondary">User</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="glass-button px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="glass-button px-4 py-2.5 rounded-lg text-sm font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
