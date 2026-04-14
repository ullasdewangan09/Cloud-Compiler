import { memo } from 'react';
import { Keyboard } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface StdinInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const StdinInput = memo(({ value, onChange }: StdinInputProps) => {
  return (
    <div className="sk-plate sk-panel h-full flex flex-col p-5 border-divider">
      <div className="flex items-center gap-2 mb-4">
        <Keyboard className="w-4 h-4 text-amber" />
        <h3 className="text-[11px] font-black text-text tracking-widest uppercase">Standard Input</h3>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full flex-1 sk-display sk-panel p-4 text-xs font-mono text-cyan tracking-widest resize-none outline-none border-divider placeholder:opacity-20"
        placeholder="Awaiting Input Stream..."
      />
    </div>
  );
});
