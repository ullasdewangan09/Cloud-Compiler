import { memo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Loader2, Terminal, Trash2, XCircle } from 'lucide-react';

import { GlassCard } from './GlassCard';
import { ExecutionResponse } from '../../services/api';

export type ExecutionStatus =
  | 'idle'
  | 'submitted'
  | 'pending'
  | 'running'
  | 'completed'
  | 'success'
  | 'compile_error'
  | 'runtime_error'
  | 'timeout'
  | 'system_error';

interface OutputPanelProps {
  output: string;
  status: ExecutionStatus;
  result?: ExecutionResponse | null;
  onClear: () => void;
}

export const OutputPanel = memo(({ output, status, result, onClear }: OutputPanelProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'submitted':
      case 'pending':
        return {
          icon: <Clock className="w-3.5 h-3.5" />,
          label: 'Queued',
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
      case 'compile_error':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          label: 'Compile Error',
          color: 'bg-status-error-bg text-status-error',
        };
      case 'runtime_error':
      case 'timeout':
      case 'system_error':
        return {
          icon: <XCircle className="w-3.5 h-3.5" />,
          label: status === 'timeout' ? 'Timeout' : 'Runtime Error',
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
  const summary = result?.diagnostics?.summary || result?.error || '';
  const stdout = result?.stdout || (status === 'success' ? output : '');
  const stderr = result?.stderr || (status !== 'success' ? output : '');
  const hasTimings =
    result?.queue_wait_ms !== null ||
    result?.compile_time_ms !== null ||
    result?.execution_time_ms !== null ||
    result?.total_time_ms !== null;
  const artifacts = result?.artifacts || [];

  return (
    <GlassCard className="h-full min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-text-secondary" />
          <h3 className="text-sm font-semibold text-text">Output</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig.color}`}>
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

      <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-divider-subtle bg-surface-solid p-4 space-y-4">
        {summary && (
          <div className="rounded-xl border border-status-error/20 bg-status-error-bg/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-status-error mb-1">Diagnostic Summary</p>
            <p className="text-sm text-text">{summary}</p>
            {!!result?.diagnostics?.details?.length && (
              <div className="mt-2 space-y-1">
                {result.diagnostics.details.map((detail, index) => (
                  <p key={index} className="text-xs font-mono text-text-secondary whitespace-pre-wrap">
                    {detail}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {hasTimings && (
          <div className="grid grid-cols-2 gap-2">
            <TimingCard label="Queue wait" value={result?.queue_wait_ms} />
            <TimingCard label="Compile" value={result?.compile_time_ms} />
            <TimingCard label="Execution" value={result?.execution_time_ms} />
            <TimingCard label="Total" value={result?.total_time_ms} />
          </div>
        )}

        {artifacts.map((artifact, index) => (
          artifact.kind === 'image' ? (
            <PreviewSection key={`${artifact.label}-${index}`} artifact={artifact} />
          ) : null
        ))}

        {stdout ? (
          <OutputSection title="Standard Output" value={stdout} />
        ) : null}

        {stderr ? (
          <OutputSection title="Standard Error" value={stderr} isError />
        ) : null}

        {!summary && !stdout && !stderr && !output && (
          <div className="h-full min-h-[180px] flex items-center justify-center">
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
});

const PreviewSection = memo(({
  artifact,
}: {
  artifact: {
    label: string;
    mime_type: string;
    base64_data: string;
    description?: string;
  };
}) => {
  return (
    <div className="rounded-xl border border-divider-subtle bg-surface p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">{artifact.label}</p>
      {artifact.description ? (
        <p className="text-xs text-text-secondary mb-3">{artifact.description}</p>
      ) : null}
      <img
        src={`data:${artifact.mime_type};base64,${artifact.base64_data}`}
        alt={artifact.label}
        className="w-full rounded-lg border border-divider-subtle bg-background/30 object-contain"
      />
    </div>
  );
});

const TimingCard = memo(({ label, value }: { label: string; value: number | null | undefined }) => {
  return (
    <div className="rounded-lg border border-divider-subtle bg-surface px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="text-sm font-semibold text-text">{value == null ? 'N/A' : `${value.toFixed(2)} ms`}</p>
    </div>
  );
});

const OutputSection = memo(({
  title,
  value,
  isError = false,
}: {
  title: string;
  value: string;
  isError?: boolean;
}) => {
  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isError ? 'text-status-error' : 'text-text-secondary'}`}>
        {title}
      </p>
      <textarea
        value={value}
        readOnly
        className="w-full min-h-[120px] resize-y rounded-xl border border-divider-subtle bg-background/40 p-3 text-sm font-mono text-text leading-6 whitespace-pre-wrap overflow-auto focus:outline-none"
      />
    </div>
  );
});
