import { memo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Loader2, Terminal, Trash2, XCircle } from 'lucide-react';

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
          label: 'IN_QUEUE',
          color: 'text-amber',
          indicator: 'text-amber',
        };
      case 'running':
        return {
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
          label: 'PROCESSING',
          color: 'text-cyan',
          indicator: 'text-cyan animate-pulse',
        };
      case 'completed':
      case 'success':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: 'OPERATIONAL',
          color: 'text-status-success',
          indicator: 'text-status-success',
        };
      case 'compile_error':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          label: 'CORE_ERROR',
          color: 'text-status-error',
          indicator: 'text-status-error',
        };
      case 'runtime_error':
      case 'timeout':
      case 'system_error':
        return {
          icon: <XCircle className="w-3.5 h-3.5" />,
          label: status === 'timeout' ? 'DEADLINE_EX' : 'FAILURE',
          color: 'text-status-error',
          indicator: 'text-status-error',
        };
      default:
        return {
          icon: <Terminal className="w-3.5 h-3.5" />,
          label: 'STANDBY',
          color: 'text-text-tertiary',
          indicator: 'text-text-tertiary opacity-30',
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
    <div className="sk-plate sk-panel h-full min-h-0 flex flex-col p-5 border-divider">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber" />
          <h3 className="text-[11px] font-black text-text tracking-widest">Console Output</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className={`sk-display sk-panel flex items-center gap-2 px-3 py-1.5 border-divider`}>
            <span className={`sk-indicator ${statusConfig.indicator}`} />
            <span className={`text-[10px] font-black tracking-widest ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
          <button
            onClick={onClear}
            className="sk-switch p-1.5 sk-panel"
            title="Wipe screen"
          >
            <Trash2 className="w-3.5 h-3.5 text-text-tertiary" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto sk-display sk-panel p-5 space-y-6 custom-scrollbar">
        {summary && (
          <div className="sk-chassis sk-panel p-4 border-status-error/30 bg-status-error-bg/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="sk-indicator text-status-error animate-pulse" />
              <p className="text-[10px] font-black tracking-widest text-status-error">Diagnostic Report</p>
            </div>
            <p className="text-xs font-bold text-text mb-2">{summary}</p>
            {!!result?.diagnostics?.details?.length && (
              <div className="space-y-1.5 mt-3 pt-3 border-t border-status-error/10">
                {result.diagnostics.details.map((detail, index) => (
                  <p key={index} className="text-[10px] font-mono text-status-error/70 whitespace-pre-wrap leading-relaxed">
                    {detail}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {hasTimings && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <TimingCard label="Queue Delay" value={result?.queue_wait_ms} />
            <TimingCard label="Compile Time" value={result?.compile_time_ms} />
            <TimingCard label="Execution Time" value={result?.execution_time_ms} />
            <TimingCard label="Total Duration" value={result?.total_time_ms} />
          </div>
        )}

        {artifacts.map((artifact, index) => (
          artifact.kind === 'image' ? (
            <PreviewSection key={`${artifact.label}-${index}`} artifact={artifact} />
          ) : null
        ))}

        {stdout ? (
          <OutputSection title="Stdout Log" value={stdout} />
        ) : null}

        {stderr ? (
          <OutputSection title="Stderr Error" value={stderr} isError />
        ) : null}

        {!summary && !stdout && !stderr && !output && (
          <div className="h-full min-h-[180px] flex items-center justify-center">
            <div className="text-center">
              <div className="relative mb-4">
                <Terminal className="w-12 h-12 mx-auto text-text-tertiary opacity-10" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <span className="sk-indicator text-cyan/20 animate-ping" style={{ width: '2rem', height: '2rem' }} />
                </div>
              </div>
              <p className="text-[10px] font-black text-text-tertiary tracking-widest">Awaiting Command Input...</p>
            </div>
          </div>
        )}
      </div>
    </div>
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
    <div className="sk-chassis sk-panel p-4 border-divider">
      <p className="text-[10px] font-black tracking-widest text-text-tertiary mb-3">{artifact.label}</p>
      {artifact.description ? (
        <p className="text-[11px] font-bold text-text-secondary mb-4">{artifact.description}</p>
      ) : null}
      <div className="sk-display sk-panel p-2">
        <img
          src={`data:${artifact.mime_type};base64,${artifact.base64_data}`}
          alt={artifact.label}
          className="w-full h-auto object-contain opacity-90 brightness-110"
        />
      </div>
    </div>
  );
});

const TimingCard = memo(({ label, value }: { label: string; value: number | null | undefined }) => {
  return (
    <div className="sk-chassis sk-panel p-3 border-divider">
      <p className="text-[9px] font-black tracking-widest text-text-tertiary mb-1">{label}</p>
      <p className="text-xs font-black text-text tracking-widest">{value == null ? '0.00' : value.toFixed(2)}<span className="text-[9px] ml-1 opacity-40">ms</span></p>
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
    <div className="space-y-2">
      <div className="flex items-center gap-2 ml-1">
        <span className={`sk-indicator ${isError ? 'text-status-error' : 'text-cyan shadow-[0_0_5px_rgba(0,209,255,0.4)]'}`} />
        <p className={`text-[10px] font-black tracking-widest ${isError ? 'text-status-error' : 'text-text-tertiary'}`}>
          {title}
        </p>
      </div>
      <pre className="w-full min-h-[120px] sk-display sk-panel p-4 text-xs font-mono text-cyan tracking-widest leading-relaxed whitespace-pre-wrap focus:outline-none custom-scrollbar border-divider overflow-auto">
        {value}
      </pre>
    </div>
  );
});
