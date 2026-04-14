import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { isAxiosError } from 'axios';
import {
  UserPlus, Loader2, AlertCircle, UserRound, Mail,
  LockKeyhole, Eye, EyeOff, Cuboid, Zap, Shield, Cpu,
  ArrowRight, Check,
} from 'lucide-react';
import { ProceduralGroundBackground } from '../components/ui/procedural-ground-background';
import { CinematicThemeSwitcher } from '../components/ui/cinematic-theme-switcher';
import { motion } from 'motion/react';

const PERKS = [
  { icon: Zap,    text: 'Instant code execution across 4+ runtimes' },
  { icon: Shield, text: 'Sandboxed, encrypted workspace by default' },
  { icon: Cpu,    text: 'CPU & memory metrics on every run' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export function Register() {
  const [username, setUsername]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [error, setError]                     = useState('');
  const [loading, setLoading]                 = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err: unknown) {
      const detail = isAxiosError<{ detail?: string }>(err) ? err.response?.data?.detail : undefined;
      setError(detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-12 sk-chassis sk-panel pl-11 pr-4 text-xs font-bold text-cyan tracking-widest outline-none border-divider focus:border-cyan/40 transition-all duration-200 placeholder:text-text-tertiary/30";

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
          <div className="w-12 h-12 sk-plate sk-panel flex items-center justify-center border-cyan/30">
            <Cuboid className="w-6 h-6 text-cyan drop-shadow-[0_0_8px_rgba(0,209,255,0.5)]" />
          </div>
          <div>
            <p className="text-text text-sm font-black tracking-[0.22em] uppercase leading-none">VeloQube</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="sk-indicator text-amber animate-pulse" />
              <p className="text-text-tertiary text-[9px] font-bold tracking-widest uppercase">Cloud Compiler</p>
            </div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div {...fadeUp(0.08)} className="mb-6">
          <h2 className="text-5xl font-black text-text leading-[1.06] tracking-tight">
            Join the<br />
            <span className="text-cyan drop-shadow-[0_0_20px_rgba(0,209,255,0.35)]">matrix.</span>
          </h2>
          <p className="mt-4 text-text-secondary text-sm leading-relaxed font-medium max-w-[290px]">
            Create your free account and unlock a professional, production-grade cloud development environment.
          </p>
        </motion.div>

        {/* Divider */}
        <div className="mb-7 h-px bg-divider w-16" />

        {/* Perks */}
        <div className="space-y-3.5 mb-10">
          {PERKS.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={text}
              {...fadeUp(0.12 + i * 0.07)}
              className="flex items-start gap-3.5"
            >
              <div className="w-7 h-7 sk-plate sk-panel flex items-center justify-center border-amber/20 shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-amber" />
              </div>
              <p className="text-text-secondary text-sm font-medium leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </div>

        {/* Free badge */}
        <motion.div {...fadeUp(0.3)} className="flex items-center gap-2 mb-12">
          <div className="sk-plate sk-panel px-4 py-2 inline-flex items-center gap-2.5 border-status-success/25">
            <Check className="w-3.5 h-3.5 text-status-success" />
            <span className="text-status-success text-[9px] font-black tracking-widest uppercase">100% Free · No Credit Card</span>
          </div>
        </motion.div>

        {/* Status */}
        <motion.div {...fadeUp(0.35)} className="flex items-center gap-2.5">
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

            {/* Cyan top accent */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent 0%, var(--cyan) 40%, var(--amber) 80%, transparent 100%)' }}
            />

            {/* Header */}
            <motion.div {...fadeUp(0.12)} className="mb-7">
              <div className="flex lg:hidden items-center gap-3 mb-6">
                <div className="w-9 h-9 sk-plate sk-panel flex items-center justify-center border-cyan/30">
                  <Cuboid className="w-4.5 h-4.5 text-cyan" />
                </div>
                <p className="text-text text-[11px] font-black tracking-[0.22em] uppercase">VeloQube</p>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="sk-indicator text-cyan animate-pulse" />
                <span className="text-text-tertiary text-[9px] font-black tracking-[0.25em] uppercase">Register Terminal</span>
              </div>
              <h1 className="text-2xl font-black text-text tracking-tight">Create account</h1>
              <p className="text-text-tertiary text-xs font-medium mt-1.5 tracking-wide">Launch your command bridge in seconds.</p>
            </motion.div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-5 sk-chassis sk-panel p-4 border-status-error/30 bg-status-error-bg flex items-start gap-3"
              >
                <AlertCircle className="w-4 h-4 text-status-error shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-status-error tracking-wider leading-relaxed">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <motion.div {...fadeUp(0.18)} className="space-y-1.5">
                <label className="block text-[9px] font-black text-text-tertiary tracking-[0.2em] uppercase ml-1">Username</label>
                <div className="relative group">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-cyan transition-colors" />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    className={inputClass} placeholder="your_username" required />
                </div>
              </motion.div>

              {/* Email */}
              <motion.div {...fadeUp(0.21)} className="space-y-1.5">
                <label className="block text-[9px] font-black text-text-tertiary tracking-[0.2em] uppercase ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-cyan transition-colors" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className={inputClass} placeholder="you@example.com" required />
                </div>
              </motion.div>

              {/* Passwords */}
              <motion.div {...fadeUp(0.24)} className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-text-tertiary tracking-[0.2em] uppercase ml-1">Password</label>
                  <div className="relative group">
                    <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary group-focus-within:text-cyan transition-colors" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full h-12 sk-chassis sk-panel pl-10 pr-9 text-xs font-bold text-cyan tracking-widest outline-none border-divider focus:border-cyan/40 transition-all placeholder:text-text-tertiary/30"
                      placeholder="Password" required />
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-cyan transition-colors">
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-text-tertiary tracking-[0.2em] uppercase ml-1">Confirm</label>
                  <div className="relative group">
                    <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary group-focus-within:text-cyan transition-colors" />
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full h-12 sk-chassis sk-panel pl-10 pr-9 text-xs font-bold text-cyan tracking-widest outline-none border-divider focus:border-cyan/40 transition-all placeholder:text-text-tertiary/30"
                      placeholder="Confirm" required />
                    <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-cyan transition-colors">
                      {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div {...fadeUp(0.28)} className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sk-switch h-13 sk-panel border-cyan/40 text-cyan flex items-center justify-center gap-3 disabled:opacity-40 sk-interactive-hover shadow-[0_0_24px_rgba(0,209,255,0.1)]"
                >
                  {loading
                    ? <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    : <UserPlus className="w-4.5 h-4.5" />
                  }
                  <span className="text-[12px] font-black uppercase tracking-[0.2em]">
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </span>
                  {!loading && <ArrowRight className="w-4 h-4 opacity-50" />}
                </button>
              </motion.div>
            </form>

            {/* Footer */}
            <motion.div
              {...fadeUp(0.33)}
              className="mt-7 pt-6 border-t border-divider flex items-center justify-between"
            >
              <p className="text-text-tertiary text-[10px] font-bold tracking-widest">Already registered?</p>
              <Link
                to="/login"
                className="sk-switch px-5 py-2 sk-panel text-[10px] font-black text-amber tracking-widest uppercase flex items-center gap-1.5"
              >
                Sign In <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>
          </div>

          {/* Version tag */}
          <motion.div {...fadeUp(0.4)} className="mt-4 flex items-center justify-center">
            <div className="sk-chassis sk-panel px-4 py-1.5 inline-flex items-center gap-2 border-divider">
              <span className="sk-indicator text-cyan animate-pulse" />
              <span className="text-text-tertiary text-[9px] font-black tracking-[0.25em] uppercase">VeloQube v4.2</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
