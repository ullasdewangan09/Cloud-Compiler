import { Terminal, Trash2, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { GlassCard } from './GlassCard';

export type ExecutionStatus =
  | 'idle'
  | 'submitted'
  | 'pending'
  | 'running'
  | 'completed'
  | 'success'
  | 'runtime_error'
  | 'timeout'
  | 'system_error';

interface OutputPanelProps {
  output: string;
  status: ExecutionStatus;
  onClear: () => void;
}

export function OutputPanel({ output, status, onClear }: OutputPanelProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'submitted':
      case 'pending':
        return {
          icon: <Clock className="w-3.5 h-3.5" />,
          label: 'Pending',
          color: 'bg-status-warning-bg text-status-warning',
        };
      case 'running':
        return {
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
          label: 'Running',
          color: 'bg-status-running-bg text-status-running',
        };
      case 'completed':
      case 'success':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: 'Success',
          color: 'bg-status-success-bg text-status-success',
        };
      case 'runtime_error':
      case 'timeout':
      case 'system_error':
        return {
          icon: <XCircle className="w-3.5 h-3.5" />,
          label: status === 'timeout' ? 'Timeout' : 'Error',
          color: 'bg-status-error-bg text-status-error',
        };
      default:
        return {
          icon: <Terminal className="w-3.5 h-3.5" />,
          label: 'Ready',
          color: 'bg-divider-subtle text-text-tertiary',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <GlassCard className="h-full min-h-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-text-secondary" />
          <h3 className="text-sm font-semibold text-text">Output</h3>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig.color}`}
          >
            {statusConfig.icon}
            <span>{statusConfig.label}</span>
          </div>
          <button
            onClick={onClear}
            className="p-1.5 hover:bg-surface rounded-lg transition-colors"
            title="Clear output"
          >
            <Trash2 className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>
      </div>

      {/* Output Area */}
      <div className="flex-1 min-h-0 bg-surface-solid rounded-xl p-4 border border-divider-subtle">
        {output ? (
          <textarea
            value={output}
            readOnly
            className="w-full h-full resize-none bg-transparent text-sm font-mono text-text leading-6 whitespace-pre-wrap overflow-auto focus:outline-none"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Terminal className="w-10 h-10 mx-auto mb-3 text-text-tertiary opacity-40" />
              <p className="text-sm text-text-secondary">Output will appear here</p>
              <p className="text-xs text-text-tertiary mt-1">Run your code to see results</p>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
