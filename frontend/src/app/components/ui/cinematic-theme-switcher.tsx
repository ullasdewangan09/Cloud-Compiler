import { Sun, Moon } from 'lucide-react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../../context/ThemeContext';

interface Particle {
  id: number;
  delay: number;
  duration: number;
}

export function CinematicThemeSwitcher() {
  const { isDark, toggleTheme } = useTheme();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const generateParticles = () => {
    const newParticles: Particle[] = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      delay: i * 0.1,
      duration: 0.6 + i * 0.1,
    }));
    setParticles(newParticles);
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setParticles([]);
    }, 1000);
  };

  const handleToggle = () => {
    generateParticles();
    toggleTheme();
  };

  return (
    <div className="relative inline-block">
      {/* SVG Filter for Film Grain Texture */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="grain-light">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="desaturatedNoise" />
            <feComponentTransfer in="desaturatedNoise" result="lightGrain">
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="lightGrain" mode="overlay" />
          </filter>
          <filter id="grain-dark">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="desaturatedNoise" />
            <feComponentTransfer in="desaturatedNoise" result="darkGrain">
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="darkGrain" mode="overlay" />
          </filter>
        </defs>
      </svg>

      {/* Pill-shaped track */}
      <motion.button
        ref={toggleRef}
        onClick={handleToggle}
        className="relative flex h-[48px] w-[80px] items-center rounded-full p-[5px] transition-all duration-300 focus:outline-none"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at top left, #1e293b 0%, #0f172a 40%, #020617 100%)'
            : 'radial-gradient(ellipse at top left, #ffffff 0%, #f1f5f9 40%, #cbd5e1 100%)',
          boxShadow: isDark
            ? `inset 5px 5px 12px rgba(0,0,0,0.9), inset -5px -5px 12px rgba(71,85,105,0.4),
               inset 0 0 20px rgba(0,0,0,0.6), 0 8px 16px rgba(0,0,0,0.4), 0 16px 32px rgba(0,0,0,0.3)`
            : `inset 5px 5px 12px rgba(148,163,184,0.5), inset -5px -5px 12px rgba(255,255,255,1),
               inset 0 0 20px rgba(203,213,225,0.3), 0 8px 16px rgba(0,0,0,0.08), 0 16px 32px rgba(0,0,0,0.06)`,
          border: isDark
            ? '2px solid rgba(51,65,85,0.6)'
            : '2px solid rgba(203,213,225,0.6)',
        }}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        role="switch"
        aria-checked={isDark}
        whileTap={{ scale: 0.97 }}
      >
        {/* Inner rim effect */}
        <div
          className="absolute inset-[3px] rounded-full pointer-events-none"
          style={{
            boxShadow: isDark
              ? 'inset 0 2px 6px rgba(0,0,0,0.9), inset 0 -1px 3px rgba(71,85,105,0.3)'
              : 'inset 0 2px 6px rgba(100,116,139,0.4), inset 0 -1px 3px rgba(255,255,255,0.8)',
          }}
        />

        {/* Glossy overlay */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at top, rgba(71,85,105,0.15) 0%, transparent 50%)'
              : 'radial-gradient(ellipse at top, rgba(255,255,255,0.8) 0%, transparent 50%)',
            mixBlendMode: 'overlay',
          }}
        />

        {/* Background Icons */}
        <div className="absolute inset-0 flex items-center justify-between px-[9px]">
          <Sun size={14} className={isDark ? 'text-yellow-100/50' : 'text-amber-500'} />
          <Moon size={14} className={isDark ? 'text-yellow-100' : 'text-slate-400'} />
        </div>

        {/* Thumb */}
        <motion.div
          className="relative z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full overflow-hidden"
          style={{
            background: isDark
              ? 'linear-gradient(145deg, #64748b 0%, #475569 50%, #334155 100%)'
              : 'linear-gradient(145deg, #ffffff 0%, #fefefe 50%, #f8fafc 100%)',
            boxShadow: isDark
              ? `inset 2px 2px 4px rgba(100,116,139,0.4), inset -2px -2px 4px rgba(0,0,0,0.8),
                 0 8px 32px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.5)`
              : `inset 2px 2px 4px rgba(203,213,225,0.3), inset -2px -2px 4px rgba(255,255,255,1),
                 0 8px 32px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.12)`,
            border: isDark
              ? '2px solid rgba(148,163,184,0.3)'
              : '2px solid rgba(255,255,255,0.9)',
          }}
          animate={{ x: isDark ? 32 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {/* Thumb shine */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, transparent 40%, rgba(0,0,0,0.1) 100%)',
              mixBlendMode: 'overlay',
            }}
          />

          {/* Particles */}
          <AnimatePresence>
            {isAnimating && particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: '8px',
                    height: '8px',
                    background: isDark
                      ? 'radial-gradient(circle, rgba(147,197,253,0.5) 0%, rgba(147,197,253,0) 70%)'
                      : 'radial-gradient(circle, rgba(251,191,36,0.7) 0%, rgba(251,191,36,0) 70%)',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: isDark ? 5 : 7, opacity: [0, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: particle.duration, delay: particle.delay, ease: 'easeOut' }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Icon */}
          <div className="relative z-10">
            {isDark ? (
              <Moon size={15} className="text-yellow-200" />
            ) : (
              <Sun size={15} className="text-amber-500" />
            )}
          </div>
        </motion.div>
      </motion.button>
    </div>
  );
}
