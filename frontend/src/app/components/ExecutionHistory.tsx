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
    <GlassCard className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-text-secondary" />
        <h3 className="text-sm font-semibold text-text">Execution History</h3>
      </div>
      <div className="flex-1 overflow-auto space-y-2">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <History className="w-10 h-10 mx-auto mb-3 text-text-tertiary opacity-40" />
              <p className="text-sm text-text-secondary">No executions yet</p>
            </div>
          </div>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="w-full p-3 bg-surface-solid hover:bg-surface border border-divider-subtle rounded-xl text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-primary">{item.language.toUpperCase()}</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <span className="text-xs text-text-tertiary">{formatTime(item.timestamp)}</span>
                </div>
              </div>
              <p className="text-xs font-semibold text-text">{item.entryFile}</p>
              <p className="text-xs font-mono text-text-secondary line-clamp-2">
                {item.files.find((file) => file.filename === item.entryFile)?.content.split('\n')[0] || 'Empty file'}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-text-tertiary">
                {item.compilerProfile ? <span>{item.compilerProfile}</span> : null}
                {item.queueWaitMs != null ? <span>queue {item.queueWaitMs.toFixed(0)}ms</span> : null}
                {item.totalTimeMs != null ? <span>total {item.totalTimeMs.toFixed(0)}ms</span> : null}
              </div>
            </button>
          ))
        )}
      </div>
    </GlassCard>
  );
}
