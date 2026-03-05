import { Keyboard } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface StdinInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function StdinInput({ value, onChange }: StdinInputProps) {
  return (
    <GlassCard className="h-full">
      <div className="flex items-center gap-2 mb-3">
        <Keyboard className="w-4 h-4 text-text-secondary" />
        <h3 className="text-sm font-semibold text-text">Standard Input</h3>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[calc(100%-2rem)] bg-surface-solid border border-divider-subtle rounded-xl p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        placeholder="Enter input for your program here..."
      />
    </GlassCard>
  );
}
