import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Loader2, AlertCircle, UserRound, LockKeyhole, Eye, EyeOff, Cuboid, ArrowLeft } from 'lucide-react';
import { isAxiosError } from 'axios';


export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/workspace');
    } catch (err: unknown) {
      const detail = isAxiosError<{ detail?: string }>(err) ? err.response?.data?.detail : undefined;
      setError(detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-ref-page">
      <div className="auth-ref-stage">
        <div className="auth-ref-decor" aria-hidden="true">
          <div className="auth-ref-widget auth-ref-widget-top">
            <div className="auth-ref-squares">
              <span className="auth-ref-square mint" />
              <span className="auth-ref-square peach" />
              <span className="auth-ref-square blue" />
            </div>
            <div className="auth-ref-lines">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="auth-ref-widget auth-ref-widget-chart">
            <div className="auth-ref-bars">
              <span style={{ height: '42%' }} />
              <span style={{ height: '58%' }} />
              <span style={{ height: '76%' }} />
              <span style={{ height: '46%' }} />
            </div>
          </div>
        </div>

        <div className="auth-ref-panel-wrap">
          <div className="auth-ref-panel">
            <Link to="/" className="auth-ref-back">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to home</span>
            </Link>

            <div className="auth-ref-brand">
              <Cuboid className="w-4 h-4" />
              <span>VeloQube | Cloud Compiler</span>
            </div>

            <h1 className="auth-ref-title">Log in</h1>
            <p className="auth-ref-subtitle">Welcome back! Please enter your details.</p>

            <form onSubmit={handleSubmit} className="auth-ref-form">
              {error && (
                <div className="auth-ref-error">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="auth-ref-field">
                <label htmlFor="login-username">Email</label>
                <div className="auth-ref-input-shell">
                  <UserRound className="auth-ref-input-icon" />
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="auth-ref-input"
                    placeholder="Username or Email Address"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="auth-ref-field">
                <label htmlFor="login-password">Password</label>
                <div className="auth-ref-input-shell">
                  <LockKeyhole className="auth-ref-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-ref-input"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="auth-ref-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="auth-ref-meta">
                <label className="auth-ref-checkbox">
                  <input type="checkbox" />
                  <span>Remember for 30 days</span>
                </label>
              </div>

              <button type="submit" disabled={loading} className="auth-ref-submit">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign in
                  </>
                )}
              </button>
            </form>

            <p className="auth-ref-footnote">
              Create a new account{' '}
              <Link to="/register" className="auth-ref-link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
