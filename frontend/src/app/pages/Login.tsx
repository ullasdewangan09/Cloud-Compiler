import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  LogIn, Loader2, AlertCircle, UserRound, LockKeyhole,
  Eye, EyeOff, Cuboid, Zap, Shield, Cpu, ArrowRight,
} from 'lucide-react';
import { isAxiosError } from 'axios';
import { ProceduralGroundBackground } from '../components/ui/procedural-ground-background';
import { CinematicThemeSwitcher } from '../components/ui/cinematic-theme-switcher';
import { motion } from 'motion/react';

const FEATURES = [
  { icon: Zap,    label: 'Blazing Fast',   sub: 'Sub-100ms execution' },
  { icon: Cpu,    label: 'Multi-Runtime',  sub: 'Python · C · C++ · Java' },
  { icon: Shield, label: 'Secure Vault',   sub: 'Encrypted sandboxing' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export function Login() {
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: unknown) {
      const detail = isAxiosError<{ detail?: string }>(err) ? err.response?.data?.detail : undefined;
      setError(detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-background">
      <ProceduralGroundBackground />

      {/* ── Floating Theme Toggle ── */}
      <motion.div
        className="absolute top-5 right-5 z-50"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <CinematicThemeSwitcher />
      </motion.div>

      {/* ═══ LEFT — Branding Panel ═══ */}
      <motion.div
        className="hidden lg:flex flex-col justify-center w-[44%] relative z-10 px-16 py-14"
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <motion.div {...fadeUp(0)} className="flex items-center gap-4 mb-14">
          <div className="w-12 h-12 sk-plate sk-panel flex items-center justify-center border-amber/30">
            <Cuboid className="w-6 h-6 text-amber drop-shadow-[0_0_8px_rgba(255,149,0,0.6)]" />
          </div>
          <div>
            <p className="text-text text-sm font-black tracking-[0.22em] uppercase leading-none">VeloQube</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="sk-indicator text-cyan animate-pulse" />
              <p className="text-text-tertiary text-[9px] font-bold tracking-widest uppercase">Cloud Compiler</p>
            </div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div {...fadeUp(0.08)} className="mb-6">
          <h2 className="text-5xl font-black text-text leading-[1.06] tracking-tight">
            Code without<br />
            <span className="text-amber drop-shadow-[0_0_20px_rgba(255,149,0,0.4)]">limits.</span>
          </h2>
          <p className="mt-4 text-text-secondary text-sm leading-relaxed font-medium max-w-[290px]">
            A precision-engineered cloud IDE for developers who demand speed, power, and elegance.
          </p>
        </motion.div>

        {/* Divider */}
        <div className="mb-7 h-px bg-divider w-16" />

        {/* Feature chips */}
        <div className="space-y-3 mb-12">
          {FEATURES.map(({ icon: Icon, label, sub }, i) => (
            <motion.div
              key={label}
              {...fadeUp(0.12 + i * 0.07)}
              className="flex items-center gap-4 px-4 py-3 sk-chassis sk-panel"
            >
              <div className="w-8 h-8 sk-plate sk-panel flex items-center justify-center border-cyan/20 shrink-0">
                <Icon className="w-3.5 h-3.5 text-cyan" />
              </div>
              <div>
                <p className="text-text text-[11px] font-black tracking-widest uppercase leading-none">{label}</p>
                <p className="text-text-tertiary text-[10px] font-medium mt-1">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Status indicator */}
        <motion.div {...fadeUp(0.32)} className="flex items-center gap-2.5">
          <span className="sk-indicator text-status-success animate-pulse" />
          <span className="text-text-tertiary text-[9px] font-bold tracking-widest uppercase">All Systems Operational</span>
        </motion.div>
      </motion.div>

      {/* ═══ RIGHT — Form Panel ═══ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Card */}
          <div className="sk-plate sk-panel p-10 border-divider backdrop-blur-2xl bg-surface/60 relative overflow-hidden">

            {/* Amber top accent */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent 0%, var(--amber) 40%, var(--cyan) 80%, transparent 100%)' }}
            />

            {/* Header */}
            <motion.div {...fadeUp(0.12)} className="mb-8">
              {/* Mobile logo */}
              <div className="flex lg:hidden items-center gap-3 mb-6">
                <div className="w-9 h-9 sk-plate sk-panel flex items-center justify-center border-amber/30">
                  <Cuboid className="w-4.5 h-4.5 text-amber" />
                </div>
                <div>
                  <p className="text-text text-[11px] font-black tracking-[0.22em] uppercase leading-none">VeloQube</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="sk-indicator text-amber animate-pulse" />
                <span className="text-text-tertiary text-[9px] font-black tracking-[0.25em] uppercase">Auth Terminal</span>
              </div>
              <h1 className="text-2xl font-black text-text tracking-tight">Welcome back</h1>
              <p className="text-text-tertiary text-xs font-medium mt-1.5 tracking-wide">Sign in to your command bridge.</p>
            </motion.div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 sk-chassis sk-panel p-4 border-status-error/30 bg-status-error-bg flex items-start gap-3"
              >
                <AlertCircle className="w-4 h-4 text-status-error shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-status-error tracking-wider leading-relaxed">{error}</p>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div {...fadeUp(0.18)} className="space-y-1.5">
                <label className="block text-[9px] font-black text-text-tertiary tracking-[0.2em] uppercase ml-1">
                  Username
                </label>
                <div className="relative group">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-amber transition-colors duration-200" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full h-12 sk-chassis sk-panel pl-11 pr-4 text-xs font-bold text-cyan tracking-widest outline-none border-divider focus:border-amber/40 transition-all duration-200 placeholder:text-text-tertiary/30"
                    placeholder="your_username"
                    required
                  />
                </div>
              </motion.div>

              <motion.div {...fadeUp(0.22)} className="space-y-1.5">
                <label className="block text-[9px] font-black text-text-tertiary tracking-[0.2em] uppercase ml-1">
                  Password
                </label>
                <div className="relative group">
                  <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-amber transition-colors duration-200" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-12 sk-chassis sk-panel pl-11 pr-12 text-xs font-bold text-cyan tracking-widest outline-none border-divider focus:border-amber/40 transition-all duration-200 placeholder:text-text-tertiary/30"
                    placeholder="••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-amber transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div {...fadeUp(0.27)} className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sk-switch h-13 sk-panel border-amber/40 text-amber flex items-center justify-center gap-3 disabled:opacity-40 sk-interactive-hover shadow-[0_0_24px_rgba(255,149,0,0.12)]"
                >
                  {loading
                    ? <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    : <LogIn className="w-4.5 h-4.5" />
                  }
                  <span className="text-[12px] font-black uppercase tracking-[0.2em]">
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </span>
                  {!loading && <ArrowRight className="w-4 h-4 opacity-50" />}
                </button>
              </motion.div>
            </form>

            {/* Footer */}
            <motion.div
              {...fadeUp(0.32)}
              className="mt-8 pt-6 border-t border-divider flex items-center justify-between"
            >
              <p className="text-text-tertiary text-[10px] font-bold tracking-widest">No account?</p>
              <Link
                to="/register"
                className="sk-switch px-5 py-2 sk-panel text-[10px] font-black text-cyan tracking-widest uppercase flex items-center gap-1.5"
              >
                Create Account <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>
          </div>

          {/* Version tag */}
          <motion.div {...fadeUp(0.38)} className="mt-4 flex items-center justify-center">
            <div className="sk-chassis sk-panel px-4 py-1.5 inline-flex items-center gap-2 border-divider">
              <span className="sk-indicator text-amber animate-pulse" />
              <span className="text-text-tertiary text-[9px] font-black tracking-[0.25em] uppercase">VeloQube v4.2</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
