import { CheckCircle2, Clock, History, XCircle } from 'lucide-react';

import { GlassCard } from './GlassCard';
import { ExecutionStatus } from './OutputPanel';
import { CodeFile, Diagnostics, ExecutionResponse } from '../../services/api';

export interface HistoryItem {
  id: string;
  language: string;
  files: CodeFile[];
  entryFile: string;
  stdout: string;
  stderr: string;
  output: string;
  status: ExecutionStatus;
  timestamp: Date;
  executionTime?: number | null;
  totalTimeMs?: number | null;
  queueWaitMs?: number | null;
  compilerProfile?: string | null;
  compilerFlags?: string;
  diagnostics?: Diagnostics;
  result?: ExecutionResponse;
}

interface ExecutionHistoryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

export function ExecutionHistory({ history, onSelect }: ExecutionHistoryProps) {
  const getStatusIcon = (status: ExecutionStatus) => {
    if (status === 'success' || status === 'completed') {
      return <CheckCircle2 className="w-4 h-4 text-status-success" />;
    }

    if (status === 'compile_error' || status === 'runtime_error' || status === 'timeout' || status === 'system_error') {
      return <XCircle className="w-4 h-4 text-status-error" />;
    }

    return <Clock className="w-4 h-4 text-status-warning" />;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="sk-plate sk-panel h-full flex flex-col p-5 border-divider">
      <div className="flex items-center gap-2 mb-5">
        <History className="w-4 h-4 text-cyan" />
        <h3 className="text-[11px] font-black text-text tracking-widest uppercase">Execution History</h3>
      </div>
      <div className="flex-1 overflow-auto space-y-3 pr-2 custom-scrollbar">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center opacity-20">
              <History className="w-10 h-10 mx-auto mb-3 text-text-tertiary" />
              <p className="text-[10px] font-black text-text-tertiary tracking-widest uppercase">No previous sessions.</p>
            </div>
          </div>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="w-full p-4 sk-chassis sk-panel text-left transition-all group hover:border-cyan/30"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-cyan uppercase tracking-widest">{item.language}</span>
                <div className="flex items-center gap-3">
                  <span className={`sk-indicator ${
                    (item.status === 'success' || item.status === 'completed') 
                      ? 'text-status-success shadow-[0_0_5px_rgba(74,222,128,0.4)]'
                      : 'text-status-error shadow-[0_0_5px_rgba(248,113,113,0.4)]'
                  }`} />
                  <span className="text-[9px] font-bold text-text-tertiary uppercase">{formatTime(item.timestamp)}</span>
                </div>
              </div>
              <p className="text-[11px] font-black text-text tracking-wider mb-2">{item.entryFile}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-divider opacity-50">
                <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">{item.compilerProfile}</span>
                <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Total: {item.totalTimeMs?.toFixed(0)}ms</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
