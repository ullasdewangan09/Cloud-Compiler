import { ReactNode, memo } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard = memo(({ children, className = '', hover = true }: GlassCardProps) => {
  return (
    <div
      className={`sk-plate sk-panel p-6 transition-all duration-300 ${
        hover ? 'hover:sk-switch hover:-translate-y-1' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
});
