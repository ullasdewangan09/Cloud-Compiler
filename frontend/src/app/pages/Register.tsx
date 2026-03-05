import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { isAxiosError } from 'axios';
import {
  UserPlus,
  Loader2,
  AlertCircle,
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password);
      navigate('/workspace');
    } catch (err: unknown) {
      const detail = isAxiosError<{ detail?: string }>(err) ? err.response?.data?.detail : undefined;
      setError(detail || 'Registration failed. Please try again.');
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
              <span style={{ height: '40%' }} />
              <span style={{ height: '56%' }} />
              <span style={{ height: '72%' }} />
              <span style={{ height: '50%' }} />
            </div>
          </div>
        </div>

        <div className="auth-ref-panel-wrap">
          <div className="auth-ref-panel">
            <div className="auth-ref-brand">
              <Sparkles className="w-4 h-4" />
              <span>Cloud Compiler Studio</span>
            </div>

            <h1 className="auth-ref-title">Create account</h1>
            <p className="auth-ref-subtitle">Create your account details to get started.</p>

            <form onSubmit={handleSubmit} className="auth-ref-form">
              {error && (
                <div className="auth-ref-error">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="auth-ref-field">
                <label htmlFor="register-username">Username</label>
                <div className="auth-ref-input-shell">
                  <UserRound className="auth-ref-input-icon" />
                  <input
                    id="register-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="auth-ref-input"
                    placeholder="Choose a username"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="auth-ref-field">
                <label htmlFor="register-email">Email</label>
                <div className="auth-ref-input-shell">
                  <Mail className="auth-ref-input-icon" />
                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-ref-input"
                    placeholder="name@company.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-ref-field">
                <label htmlFor="register-password">Password</label>
                <div className="auth-ref-input-shell">
                  <LockKeyhole className="auth-ref-input-icon" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-ref-input"
                    placeholder="Create a password"
                    autoComplete="new-password"
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

              <div className="auth-ref-field">
                <label htmlFor="register-confirm-password">Confirm password</label>
                <div className="auth-ref-input-shell">
                  <LockKeyhole className="auth-ref-input-icon" />
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="auth-ref-input"
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="auth-ref-toggle"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-ref-submit">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create account
                  </>
                )}
              </button>
            </form>

            <p className="auth-ref-footnote">
              Already have an account?{' '}
              <Link to="/login" className="auth-ref-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
