import { ReactNode, useEffect, useState } from 'react';
import { AlertCircle, BarChart3, Clock, Cpu, Database, Loader2, TimerReset, Activity, Zap } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { apiService } from '../../services/api';

/* ─── Machina Color Palette ─────────────────────────── */
const C = {
  amber:   '#f59e0b',
  cyan:    '#06b6d4',
  violet:  '#8b5cf6',
  rose:    '#f43f5e',
  emerald: '#10b981',
  sky:     '#38bdf8',
};

/* ─── Types ─────────────────────────────────────────── */
interface QueueMetrics {
  queue_length: number;
  average_queue_wait_ms: number;
  max_queue_wait_ms: number;
  recent_queue_wait: Array<{ job_id: string; queue_wait_ms: number }>;
}
interface WorkerMetrics {
  active_workers: number;
  running_jobs: number;
  workers: Record<string, { status: string; current_job: string | null; updated_at: number }>;
}
interface SystemMetrics { cpu_usage_percent: number; memory_usage_percent: number }
interface JobMetrics {
  completed_jobs: number;
  failed_jobs: number;
  success_rate_percent: number;
  average_total_time_ms: number;
  average_compile_time_ms: number;
  average_execution_time_ms: number;
  status_counts: Record<string, number>;
  latency_trend: Array<{
    job_id: string; language: string; status: string;
    total_time_ms: number; queue_wait_ms: number; execution_time_ms: number;
  }>;
}

/* ─── Custom Tooltip ───────────────────────────────── */
const MachinaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="sk-plate sk-panel px-4 py-3 border-divider text-[10px] font-black tracking-widest space-y-1.5 min-w-[130px]">
      <p className="text-text-tertiary uppercase mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-text-tertiary uppercase">{p.name}</span>
          </span>
          <span className="text-text font-black">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Status Bar Colors ─────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  success:       C.emerald,
  completed:     C.emerald,
  failed:        C.rose,
  runtime_error: C.rose,
  timeout:       C.amber,
  system_error:  C.violet,
  pending:       C.sky,
  running:       C.cyan,
};

/* ─── Main Component ────────────────────────────────── */
export function Metrics() {
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [workerMetrics, setWorkerMetrics] = useState<WorkerMetrics | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [jobMetrics, setJobMetrics]     = useState<JobMetrics | null>(null);

  useEffect(() => {
    void loadMetrics();
    const interval = setInterval(() => void loadMetrics(), 5000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const [queue, workers, system, jobs] = await Promise.all([
        apiService.getQueueMetrics(),
        apiService.getWorkerMetrics(),
        apiService.getSystemMetrics(),
        apiService.getJobMetrics(),
      ]);
      setQueueMetrics(queue); setWorkerMetrics(workers);
      setSystemMetrics(system); setJobMetrics(jobs);
      setError(null);
    } catch (err: any) {
      setError(err.response?.status === 403 || err.response?.status === 401
        ? 'Access denied. Admin privileges required.'
        : 'Failed to load metrics: ' + err.message);
    } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 sk-plate sk-panel flex items-center justify-center mx-auto border-amber/30">
          <Loader2 className="w-8 h-8 animate-spin text-amber" />
        </div>
        <p className="text-text-tertiary text-[10px] font-black tracking-[0.25em] uppercase">Syncing Telemetry...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="sk-plate sk-panel p-12 border-status-error/20 text-center max-w-md">
        <AlertCircle className="w-12 h-12 text-status-error mx-auto mb-4" />
        <h2 className="text-lg font-black text-text tracking-wider mb-2">Access Denied</h2>
        <p className="text-text-secondary text-sm">{error}</p>
      </div>
    </div>
  );

  const queueLength  = queueMetrics?.queue_length ?? 0;
  const workerCount  = workerMetrics?.active_workers ?? 0;
  const runningJobs  = workerMetrics?.running_jobs ?? 0;
  const totalJobs    = (jobMetrics?.completed_jobs ?? 0) + (jobMetrics?.failed_jobs ?? 0);

  const statusData = Object.entries(jobMetrics?.status_counts || {}).map(([status, count]) => ({ status, count }));

  const latencyData = (jobMetrics?.latency_trend || []).map((item, i) => ({
    label: item.job_id?.slice(0, 6) || `j-${i + 1}`,
    total: Math.round(item.total_time_ms || 0),
    queue: Math.round(item.queue_wait_ms || 0),
    exec:  Math.round(item.execution_time_ms || 0),
  }));

  const queueWaitData = (queueMetrics?.recent_queue_wait || []).map((item, i) => ({
    label: item.job_id?.slice(0, 6) || `q-${i + 1}`,
    wait:  Math.round(item.queue_wait_ms || 0),
  }));

  const cpu    = systemMetrics?.cpu_usage_percent ?? 0;
  const memory = systemMetrics?.memory_usage_percent ?? 0;
  const radialData = [
    { name: 'CPU',    value: cpu,    fill: C.amber },
    { name: 'Memory', value: memory, fill: C.cyan  },
  ];

  const axisProps = { stroke: 'var(--text-tertiary)', tick: { fill: 'var(--text-tertiary)', fontSize: 10, fontWeight: 700, fontFamily: 'inherit' }, tickLine: false, axisLine: false };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 sk-plate sk-panel flex items-center justify-center border-amber/30">
                <Activity className="w-4 h-4 text-amber" />
              </div>
              <span className="sk-indicator text-amber animate-pulse" />
              <span className="text-text-tertiary text-[9px] font-black tracking-[0.25em] uppercase">Live Telemetry</span>
            </div>
            <h1 className="text-3xl font-black text-text tracking-tight">Execution Metrics</h1>
            <p className="text-text-secondary text-sm mt-1">Queue telemetry, latency breakdowns, and job outcome trends</p>
          </div>
          <div className="sk-chassis sk-panel px-4 py-2 flex items-center gap-2 border-divider">
            <span className="sk-indicator text-status-success animate-pulse" />
            <span className="text-text-tertiary text-[9px] font-black tracking-widest uppercase">Auto-refresh 5s</span>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard icon={<Database className="w-5 h-5" />} iconColor={C.sky}    title="Queue Depth"   value={queueLength} sub="queued jobs" />
          <KpiCard icon={<Cpu className="w-5 h-5" />}      iconColor={C.emerald} title="Active Workers" value={workerCount} sub={`${runningJobs} running`} />
          <KpiCard icon={<Clock className="w-5 h-5" />}    iconColor={C.amber}   title="Avg Queue Wait" value={`${queueMetrics?.average_queue_wait_ms ?? 0} ms`} sub={`max ${queueMetrics?.max_queue_wait_ms ?? 0} ms`} />
          <KpiCard icon={<TimerReset className="w-5 h-5" />} iconColor={C.violet} title="Avg Total Time" value={`${jobMetrics?.average_total_time_ms ?? 0} ms`} sub={`exec ${jobMetrics?.average_execution_time_ms ?? 0} ms`} />
          <KpiCard icon={<BarChart3 className="w-5 h-5" />} iconColor={C.rose}   title="Success Rate"  value={`${jobMetrics?.success_rate_percent ?? 0}%`} sub={`${totalJobs} recent jobs`} />
        </div>

        {/* ── Charts Row 1 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Job Status Breakdown */}
          <ChartCard title="Job Status Breakdown" icon={<BarChart3 className="w-4 h-4 text-amber" />}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData} barSize={32}>
                <defs>
                  {statusData.map(({ status }) => {
                    const col = STATUS_COLORS[status] ?? C.sky;
                    return (
                      <linearGradient key={status} id={`bar-${status}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={col} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={col} stopOpacity={0.3} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                <XAxis dataKey="status" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<MachinaTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusData.map(({ status }) => (
                    <Cell key={status} fill={`url(#bar-${status})`} stroke={STATUS_COLORS[status] ?? C.sky} strokeWidth={1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Queue Wait Trend */}
          <ChartCard title="Queue Wait Trend" icon={<Clock className="w-4 h-4 text-cyan" />}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={queueWaitData}>
                <defs>
                  <linearGradient id="queueGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor={C.cyan}  />
                    <stop offset="100%" stopColor={C.violet} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<MachinaTooltip />} cursor={{ stroke: 'var(--divider)', strokeWidth: 1 }} />
                <Line
                  type="monotone" dataKey="wait" strokeWidth={2.5}
                  stroke="url(#queueGrad)"
                  dot={{ fill: C.cyan, stroke: 'var(--surface)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: C.violet, stroke: 'var(--surface)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Charts Row 2 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Latency Breakdown */}
          <ChartCard title="Latency Breakdown" icon={<Zap className="w-4 h-4 text-amber" />}>
            <div className="flex items-center gap-5 mb-4">
              {[['Total', C.amber], ['Queue', C.rose], ['Exec', C.emerald]].map(([name, color]) => (
                <span key={name} className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-text-tertiary uppercase">
                  <span className="w-5 h-0.5 rounded-full" style={{ background: color as string }} />
                  {name}
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<MachinaTooltip />} cursor={{ stroke: 'var(--divider)', strokeWidth: 1 }} />
                <Line type="monotone" dataKey="total" stroke={C.amber}   strokeWidth={2.5} dot={{ fill: C.amber,   r: 3, stroke: 'var(--surface)', strokeWidth: 1.5 }} name="Total" />
                <Line type="monotone" dataKey="queue" stroke={C.rose}    strokeWidth={2}   dot={{ fill: C.rose,    r: 3, stroke: 'var(--surface)', strokeWidth: 1.5 }} name="Queue" />
                <Line type="monotone" dataKey="exec"  stroke={C.emerald} strokeWidth={2}   dot={{ fill: C.emerald, r: 3, stroke: 'var(--surface)', strokeWidth: 1.5 }} name="Exec" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* System Load */}
          <ChartCard title="System Load" icon={<Cpu className="w-4 h-4 text-cyan" />}>
            <div className="flex flex-col h-full space-y-4">
              {/* Radial gauges */}
              <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="80%" 
                    innerRadius="40%" 
                    outerRadius="100%" 
                    barSize={20} 
                    data={radialData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar
                      label={false}
                      background={{ fill: 'var(--divider-subtle)', opacity: 0.2 }}
                      dataKey="value"
                      cornerRadius={15}
                    />
                    <Tooltip content={<MachinaTooltip />} />
                  </RadialBarChart>
                </ResponsiveContainer>
                
                {/* Fixed "Proper" Legend Readouts */}
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-10">
                  {radialData.map(d => (
                    <div key={d.name} className="flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-1.5 px-3 py-1 sk-chassis sk-panel border-divider/30 bg-background/40">
                        <div className="w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: d.fill }} />
                        <span className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.25em]">{d.name}</span>
                      </div>
                      <span className="text-xl font-black text-text tracking-tight tabular-nums">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stat tiles */}
              <div className="grid grid-cols-2 gap-4">
                <LoadTile label="Compile Avg"   value={`${jobMetrics?.average_compile_time_ms ?? 0} ms`}  accent={C.violet}  />
                <LoadTile label="Execution Avg" value={`${jobMetrics?.average_execution_time_ms ?? 0} ms`} accent={C.emerald} />
              </div>
            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────── */

function KpiCard({
  icon, iconColor, title, value, sub,
}: { icon: ReactNode; iconColor: string; title: string; value: string | number; sub: string }) {
  return (
    <div className="sk-plate sk-panel p-5 border-divider relative overflow-hidden group hover:border-amber/20 transition-all">
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${iconColor}60, transparent)` }} />
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 sk-chassis sk-panel flex items-center justify-center"
          style={{ color: iconColor, borderColor: `${iconColor}30` }}
        >
          {icon}
        </div>
      </div>
      <p className="text-[9px] font-black text-text-tertiary tracking-[0.2em] uppercase mb-1">{title}</p>
      <p className="text-2xl font-black text-text tracking-tight leading-none">{value}</p>
      <p className="text-[10px] text-text-tertiary mt-1.5 font-medium">{sub}</p>
    </div>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="sk-plate sk-panel p-6 border-divider relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[1px] bg-divider" />
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-7 h-7 sk-chassis sk-panel flex items-center justify-center border-divider">
          {icon}
        </div>
        <h3 className="text-[11px] font-black text-text tracking-widest uppercase">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function LoadTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className="sk-chassis sk-panel p-4 relative overflow-hidden"
      style={{ borderColor: `${accent}25` }}
    >
      <div className="absolute inset-y-0 left-0 w-[2px]" style={{ background: accent }} />
      <p className="text-[9px] font-black text-text-tertiary tracking-[0.15em] uppercase mb-1">{label}</p>
      <p className="text-xl font-black tracking-tight" style={{ color: accent }}>{value}</p>
    </div>
  );
}
