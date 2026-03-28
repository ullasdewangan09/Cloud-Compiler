import { Copy, ExternalLink, Loader2, MonitorPlay, Square } from 'lucide-react';
import { toast } from 'sonner';

import { GlassCard } from './GlassCard';
import { InteractiveSessionResponse } from '../../services/api';

interface InteractiveSessionPanelProps {
  session: InteractiveSessionResponse | null;
  launching: boolean;
  stopping: boolean;
  onStop: () => void;
}

export function InteractiveSessionPanel({
  session,
  launching,
  stopping,
  onStop,
}: InteractiveSessionPanelProps) {
  const copyLink = async () => {
    if (!session?.interactive_url) {
      return;
    }
    await navigator.clipboard.writeText(session.interactive_url);
    toast.success('Interactive session link copied');
  };

  if (!launching && !session) {
    return null;
  }

  return (
    <GlassCard className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <MonitorPlay className="w-4 h-4 text-text-secondary" />
          <div>
            <h3 className="text-sm font-semibold text-text">Interactive Swing</h3>
            <p className="text-xs text-text-secondary">
              {launching
                ? 'Starting browser session...'
                : session?.message || 'Interactive session'}
            </p>
          </div>
        </div>

        {session ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(session.interactive_url || '', '_blank', 'noopener,noreferrer')}
              disabled={!session.interactive_url}
              className="glass-button px-3 py-2 rounded-xl flex items-center gap-2 text-xs disabled:opacity-60"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open
            </button>
            <button
              onClick={() => void copyLink()}
              disabled={!session.interactive_url}
              className="glass-button px-3 py-2 rounded-xl flex items-center gap-2 text-xs disabled:opacity-60"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
            <button
              onClick={onStop}
              disabled={stopping}
              className="glass-button px-3 py-2 rounded-xl flex items-center gap-2 text-xs disabled:opacity-60"
            >
              {stopping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
              Stop
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-divider-subtle bg-surface-solid overflow-hidden">
        {launching ? (
          <div className="h-full min-h-[220px] flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-text">Preparing your Java Swing window</p>
              <p className="text-xs text-text-secondary mt-1">This can take a few seconds the first time.</p>
            </div>
          </div>
        ) : session?.interactive_url ? (
          <iframe
            src={session.interactive_url}
            title="Interactive Java Swing Session"
            className="w-full h-full min-h-[300px] bg-white"
          />
        ) : (
          <div className="h-full min-h-[220px] flex items-center justify-center px-6 text-center">
            <p className="text-sm text-text-secondary">Interactive session URL is not available.</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
