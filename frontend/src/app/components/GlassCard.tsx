import { ReactNode, memo } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard = memo(({ children, className = '', hover = true }: GlassCardProps) => {
  return (
    <div
      className={`glass-card rounded-2xl p-6 transition-all duration-300 ${
        hover ? 'hover:shadow-2xl hover:-translate-y-1' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
});
