import { ReactNode, useEffect, useState, useMemo } from 'react';
import { 
  Activity, 
  AlertCircle, 
  Database, 
  Loader2, 
  Server, 
  TimerReset, 
  TrendingUp, 
  Cpu, 
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutDashboard
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

import { GlassCard } from '../components/GlassCard';
import { apiService } from '../../services/api';

interface DashboardData {
  system_state: {
    queue_length: number;
    active_workers: number;
    running_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    success_rate_percent: number;
    average_total_time_ms: number;
  };
  queue_metrics: {
    queue_length: number;
    average_queue_wait_ms: number;
  };
  worker_metrics: {
    active_workers: number;
    running_jobs: number;
    workers: Record<string, { status: string; current_job: string | null; updated_at: number }>;
  };
  system_metrics: {
    cpu_usage_percent: number;
    memory_usage_percent: number;
  };
  job_metrics: {
    average_compile_time_ms: number;
    average_execution_time_ms: number;
  };
  recent_executions: Array<{
    user: string;
    language: string;
    status: string;
    total_time_ms?: number;
    queue_wait_ms?: number;
    error?: string;
    timestamp?: number;
  }>;
}

const COLORS = {
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  cyan: '#00d1ff',
  amber: '#ffb000',
  emerald: '#10b981',
};

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    void loadDashboard();
    const interval = setInterval(() => void loadDashboard(), 3000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await apiService.getVisualizationDashboard();
      setDashboardData(data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError('UNAUTHORIZED_ACCESS: Administrative clearance required for telemetry access.');
      } else {
        setError('LINK_FAILURE: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const statusData = useMemo(() => {
    if (!dashboardData) return [];
    const state = dashboardData.system_state;
    return [
      { name: 'Success', value: state.completed_jobs, color: COLORS.success },
      { name: 'Failed', value: state.failed_jobs, color: COLORS.error },
      { name: 'Active', value: state.running_jobs, color: COLORS.info },
    ].filter(d => d.value > 0);
  }, [dashboardData]);

  const latencyPoints = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData.recent_executions.map((exec, index) => ({
      x: index,
      y: exec.total_time_ms || 0,
      name: exec.user,
      status: exec.status
    }));
  }, [dashboardData]);

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.05)_0%,transparent_50%)]" />
        <div className="z-10 text-center scale-110">
          <div className="w-16 h-16 sk-chassis sk-panel flex items-center justify-center border-cyan/20 animate-pulse mx-auto mb-6">
            <Loader2 className="w-8 h-8 animate-spin text-cyan" />
          </div>
          <p className="text-[10px] font-black text-cyan uppercase tracking-[0.3em] animate-pulse">Initializing Data Link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-12 flex items-center justify-center bg-background">
        <div className="max-w-xl w-full">
          <div className="sk-plate sk-panel p-12 border-status-error/20 bg-status-error-bg/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertCircle className="w-24 h-24 text-status-error" />
            </div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 sk-chassis sk-panel flex items-center justify-center border-status-error/30">
                <AlertCircle className="w-6 h-6 text-status-error" />
              </div>
              <div>
                <h2 className="text-xl font-black text-text tracking-widest uppercase">System Restriction</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-status-error animate-pulse" />
                  <span className="text-[9px] font-black text-status-error uppercase tracking-widest">Access Denied</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-text-tertiary tracking-widest font-bold leading-loose mb-10 opacity-70">
              {error}
              <br /><br />
              If you believe this is an error, contact your system administrator to verify your clearance level.
            </p>
            <div className="h-px w-full bg-gradient-to-r from-status-error/40 to-transparent" />
          </div>
        </div>
      </div>
    );
  }

  const { system_state: state, queue_metrics: queue, worker_metrics: workers, system_metrics: system, job_metrics: jobs } = dashboardData!;

  return (
    <div className="min-h-screen p-8 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan/5 blur-[120px] rounded-full -mr-96 -mt-96 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber/5 blur-[100px] rounded-full -ml-72 -mb-72 pointer-events-none" />
      
      <div className="max-w-[1600px] mx-auto relative z-10 space-y-8">
        {/* Tactical Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-divider pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sk-chassis sk-panel flex items-center justify-center border-amber/20">
                <LayoutDashboard className="w-6 h-6 text-amber" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-text tracking-widest uppercase italic">Execution Metrics</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="sk-indicator text-cyan animate-pulse shadow-[0_0_8px_rgba(0,209,255,0.4)]" />
                  <span className="text-[10px] font-black text-text-tertiary tracking-[0.2em]">REAL-TIME CORE TELEMETRY // v4.2.1</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="sk-display sk-panel px-6 py-3 flex flex-col items-end min-w-[200px]">
              <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest opacity-60">System Health</span>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-black text-emerald tracking-tighter">99.8%</span>
                <TrendingUp className="w-4 h-4 text-emerald mb-1.5" />
              </div>
            </div>
            <div className="sk-display sk-panel px-6 py-3 flex flex-col items-end min-w-[200px]">
              <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest opacity-60">Success Velocity</span>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-black text-cyan tracking-tighter">+{state?.success_rate_percent}%</span>
                <Zap className="w-4 h-4 text-cyan mb-1.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <TacticalMetric 
            label="Queue Depth" 
            value={queue?.queue_length || 0} 
            unit="JOBS" 
            subValue={`${queue?.average_queue_wait_ms || 0}ms avg wait`}
            icon={<Database className="w-5 h-5" />}
            color="cyan"
          />
          <TacticalMetric 
            label="Active Workers" 
            value={workers?.active_workers || 0} 
            unit="CORES" 
            subValue={`${workers?.running_jobs || 0} jobs processing`}
            icon={<Server className="w-5 h-5" />}
            color="amber"
          />
          <TacticalMetric 
            label="Process Success" 
            value={`${state?.success_rate_percent || 0}`} 
            unit="%" 
            subValue={`${state?.completed_jobs || 0} total completion`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="emerald"
          />
          <TacticalMetric 
            label="Avg Total Time" 
            value={state?.average_total_time_ms || 0} 
            unit="MS" 
            subValue={`${jobs?.average_execution_time_ms || 0}ms execution`}
            icon={<TimerReset className="w-5 h-5" />}
            color="info"
          />
        </div>

        {/* Visualization Tier */}
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-5 space-y-8">
            <GlassCard className="h-[400px] flex flex-col">
              <div className="flex items-center gap-2 mb-8">
                <Activity className="w-4 h-4 text-cyan" />
                <h3 className="text-xs font-black text-text uppercase tracking-widest">Process Outcome Breakdown</h3>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={1500}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: '8px', fontSize: '10px', color: 'var(--text)' }}
                      itemStyle={{ color: 'var(--text)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-text tracking-tighter">{state?.completed_jobs + state?.failed_jobs}</span>
                  <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Executed</span>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-6">
                {statusData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{d.name}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="space-y-6">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber" />
                <h3 className="text-xs font-black text-text uppercase tracking-widest">Platform Infrastructure</h3>
              </div>
              <div className="space-y-6">
                <StatusGauge label="CPU CORE LOAD" value={system?.cpu_usage_percent || 0} color="amber" />
                <StatusGauge label="MEMORY ALLOCATION" value={system?.memory_usage_percent || 0} color="cyan" />
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="sk-chassis p-4 sk-panel">
                    <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest block mb-2">Compiler Avg</span>
                    <span className="text-xl font-black text-text tracking-widest">{jobs?.average_compile_time_ms}</span>
                    <span className="text-[8px] font-bold text-text-tertiary ml-1 tracking-widest">MS</span>
                  </div>
                  <div className="sk-chassis p-4 sk-panel">
                    <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest block mb-2">Execution Avg</span>
                    <span className="text-xl font-black text-text tracking-widest">{jobs?.average_execution_time_ms}</span>
                    <span className="text-[8px] font-bold text-text-tertiary ml-1 tracking-widest">MS</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="col-span-12 lg:col-span-7 space-y-8">
            <GlassCard className="h-[450px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan" />
                  <h3 className="text-xs font-black text-text uppercase tracking-widest">Latency Distribution</h3>
                </div>
                <div className="sk-indicator text-emerald animate-pulse" />
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Submission" 
                      hide
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Time" 
                      unit="ms" 
                      stroke="rgba(255,255,255,0.3)" 
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ZAxis type="number" range={[60, 400]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: '8px', fontSize: '10px' }}
                    />
                    <Scatter name="Executions" data={latencyPoints} fill={COLORS.cyan}>
                      {latencyPoints.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.status === 'success' ? COLORS.emerald : entry.status === 'running' ? COLORS.warning : COLORS.error} 
                          fillOpacity={0.6}
                          stroke={entry.status === 'success' ? COLORS.emerald : COLORS.error}
                          strokeWidth={1}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="flex-1">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-4 h-4 text-cyan" />
                <h3 className="text-xs font-black text-text uppercase tracking-widest">Real-time Stream</h3>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-auto custom-scrollbar pr-2">
                {dashboardData.recent_executions.length === 0 ? (
                  <div className="sk-chassis sk-panel p-8 text-center">
                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest opacity-40">No telemetry frames detected</p>
                  </div>
                ) : (
                  dashboardData.recent_executions.map((job, index) => (
                    <div key={`${job.user}-${index}`} className="group flex items-center justify-between p-4 sk-chassis sk-panel bg-background/20 hover:border-cyan/30 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${job.status === 'success' ? 'bg-emerald' : job.status === 'running' ? 'bg-warning animate-pulse' : 'bg-error'} shadow-[0_0_8px_currentColor]`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-text tracking-widest uppercase">{job.user}</span>
                            <span className="text-[8px] font-bold text-text-tertiary px-1.5 py-0.5 sk-display sk-panel">{job.language.toUpperCase()}</span>
                          </div>
                          <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest mt-0.5 opacity-60">{job.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[11px] font-black text-cyan tracking-widest">{job.total_time_ms || '---'}</span>
                          <span className="text-[8px] font-black text-text-tertiary opacity-40 italic">ms</span>
                        </div>
                        <p className="text-[8px] font-bold text-text-tertiary uppercase tracking-[0.15em] opacity-40">{job.total_time_ms ? 'processed' : 'inflight'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function TacticalMetric({ label, value, unit, subValue, icon, color }: {
  label: string;
  value: string | number;
  unit: string;
  subValue: string;
  icon: ReactNode;
  color: keyof typeof COLORS;
}) {
  const colorHex = COLORS[color] || COLORS.cyan;
  
  return (
    <div className="group relative">
      <div className="sk-plate sk-panel p-6 border-divider relative overflow-hidden transition-all duration-500 hover:border-divider-strong hover:sk-switch">
        <div 
          className="absolute top-0 left-0 w-1 h-full bg-current transition-all duration-500 group-hover:w-1.5"
          style={{ color: colorHex }}
        />
        <div className="flex items-start justify-between mb-4">
          <span className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.2em]">{label}</span>
          <div className="p-2 sk-display sk-panel opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: colorHex }}>
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-text tracking-tighter tabular-nums">{value}</span>
          <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest opacity-40">{unit}</span>
        </div>
        <div className="mt-4 flex items-center gap-2 opacity-60">
          <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: colorHex }} />
          <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">{subValue}</span>
        </div>
      </div>
    </div>
  );
}

function StatusGauge({ label, value, color }: { label: string, value: number, color: keyof typeof COLORS }) {
  const colorHex = COLORS[color] || COLORS.cyan;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.2em]">{label}</span>
        <span className="text-[10px] font-black text-text tracking-widest" style={{ color: colorHex }}>{value}%</span>
      </div>
      <div className="h-1.5 bg-background sk-panel overflow-hidden border-none p-0">
        <div 
          className="h-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]"
          style={{ width: `${value}%`, backgroundColor: colorHex, color: colorHex }}
        />
      </div>
    </div>
  );
}
