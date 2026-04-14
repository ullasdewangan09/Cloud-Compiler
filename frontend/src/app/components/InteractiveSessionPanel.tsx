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
    <div className="sk-plate sk-panel h-full flex flex-col p-5 border-cyan/10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="sk-chassis sk-panel p-2 border-cyan/20">
            <MonitorPlay className="w-5 h-5 text-cyan" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-text uppercase tracking-[0.2em]">Live Session</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`sk-indicator ${launching ? 'text-amber animate-pulse' : 'text-cyan shadow-[0_0_5px_rgba(0,209,255,0.4)]'}`} />
              <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">
                {launching
                  ? 'Connecting...'
                  : session?.message || 'Connected'}
              </p>
            </div>
          </div>
        </div>

        {session ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(session.interactive_url || '', '_blank', 'noopener,noreferrer')}
              disabled={!session.interactive_url}
              className="sk-switch px-4 py-2 sk-panel flex items-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan" />
              Open Link
            </button>
            <button
              onClick={() => void copyLink()}
              disabled={!session.interactive_url}
              className="sk-switch px-4 py-2 sk-panel flex items-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
            >
              <Copy className="w-3.5 h-3.5 text-cyan" />
              Copy Link
            </button>
            <button
              onClick={onStop}
              disabled={stopping}
              className="sk-switch px-4 py-2 sk-panel flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-status-error/30 text-status-error disabled:opacity-40"
            >
              {stopping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5 fill-status-error/30" />}
              End Session
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 sk-display sk-panel overflow-hidden border-divider relative">
        {launching ? (
          <div className="h-full min-h-[220px] flex items-center justify-center bg-background/40">
            <div className="text-center">
              <div className="relative mb-6">
                <Loader2 className="w-10 h-10 animate-spin text-cyan mx-auto" />
                <div className="absolute inset-0 sk-indicator text-cyan/20 animate-ping" />
              </div>
              <p className="text-[10px] font-black text-text uppercase tracking-[0.2em]">Connecting to Session...</p>
              <p className="text-[9px] font-bold text-text-tertiary uppercase mt-2 tracking-widest">Starting remote environment</p>
            </div>
          </div>
        ) : session?.interactive_url ? (
          <iframe
            src={session.interactive_url}
            title="Interactive Java Swing Session"
            className="w-full h-full min-h-[300px] border-none"
          />
        ) : (
          <div className="h-full min-h-[220px] flex items-center justify-center px-6 text-center bg-background/40">
            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">No Active Session</p>
          </div>
        )}
        
        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50" style={{ backgroundSize: '100% 2px, 3px 100%' }} />
      </div>
    </div>
  );
}
