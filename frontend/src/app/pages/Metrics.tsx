import { ReactNode, useEffect, useState } from 'react';
import { AlertCircle, BarChart3, Clock, Cpu, Database, Loader2, TimerReset } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { GlassCard } from '../components/GlassCard';
import { apiService } from '../../services/api';

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

interface SystemMetrics {
  cpu_usage_percent: number;
  memory_usage_percent: number;
}

interface JobMetrics {
  completed_jobs: number;
  failed_jobs: number;
  success_rate_percent: number;
  average_total_time_ms: number;
  average_compile_time_ms: number;
  average_execution_time_ms: number;
  status_counts: Record<string, number>;
  latency_trend: Array<{
    job_id: string;
    language: string;
    status: string;
    total_time_ms: number;
    queue_wait_ms: number;
    execution_time_ms: number;
  }>;
}

export function Metrics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [workerMetrics, setWorkerMetrics] = useState<WorkerMetrics | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [jobMetrics, setJobMetrics] = useState<JobMetrics | null>(null);

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

      setQueueMetrics(queue);
      setWorkerMetrics(workers);
      setSystemMetrics(system);
      setJobMetrics(jobs);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError('Failed to load metrics: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-secondary">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto mt-20">
          <GlassCard>
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-status-error mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-text mb-2">Access Denied</h2>
              <p className="text-text-secondary">{error}</p>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  const queueLength = queueMetrics?.queue_length ?? 0;
  const workerCount = workerMetrics?.active_workers ?? 0;
  const runningJobs = workerMetrics?.running_jobs ?? 0;
  const totalJobs = (jobMetrics?.completed_jobs ?? 0) + (jobMetrics?.failed_jobs ?? 0);
  const statusDistributionData = Object.entries(jobMetrics?.status_counts || {}).map(([status, count]) => ({
    status,
    count,
  }));
  const latencyTrendData = (jobMetrics?.latency_trend || []).map((item, index) => ({
    label: item.job_id?.slice(0, 6) || `job-${index + 1}`,
    total: Math.round(item.total_time_ms || 0),
    queue: Math.round(item.queue_wait_ms || 0),
    execution: Math.round(item.execution_time_ms || 0),
  }));

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Execution Metrics</h1>
          <p className="text-text-secondary">Queue telemetry, latency breakdowns, and job outcome trends</p>
        </div>

        <div className="grid grid-cols-5 gap-6 mb-6">
          <MetricCard icon={<Database className="w-6 h-6 text-sky-deep" />} title="Queue Depth" value={queueLength} sublabel="queued jobs" />
          <MetricCard icon={<Cpu className="w-6 h-6 text-mint-deep" />} title="Active Workers" value={workerCount} sublabel={`${runningJobs} running jobs`} />
          <MetricCard icon={<Clock className="w-6 h-6 text-peach-deep" />} title="Avg Queue Wait" value={`${queueMetrics?.average_queue_wait_ms ?? 0} ms`} sublabel={`max ${queueMetrics?.max_queue_wait_ms ?? 0} ms`} />
          <MetricCard icon={<TimerReset className="w-6 h-6 text-lavender-deep" />} title="Avg Total Time" value={`${jobMetrics?.average_total_time_ms ?? 0} ms`} sublabel={`execution ${jobMetrics?.average_execution_time_ms ?? 0} ms`} />
          <MetricCard icon={<BarChart3 className="w-6 h-6 text-sky-deep" />} title="Success Rate" value={`${jobMetrics?.success_rate_percent ?? 0}%`} sublabel={`${totalJobs} recent jobs`} />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <GlassCard>
            <h3 className="text-lg font-semibold text-text mb-4">Job Status Breakdown</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
                  <XAxis dataKey="status" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--sky)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-semibold text-text mb-4">Queue Wait Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={(queueMetrics?.recent_queue_wait || []).map((item, index) => ({
                  label: item.job_id?.slice(0, 6) || `q-${index + 1}`,
                  wait: Math.round(item.queue_wait_ms || 0),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
                  <XAxis dataKey="label" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip />
                  <Line type="monotone" dataKey="wait" stroke="var(--mint)" strokeWidth={2} dot={{ fill: 'var(--mint-deep)', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <GlassCard>
            <h3 className="text-lg font-semibold text-text mb-4">Latency Breakdown</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
                  <XAxis dataKey="label" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="var(--sky)" strokeWidth={2} />
                  <Line type="monotone" dataKey="queue" stroke="var(--peach)" strokeWidth={2} />
                  <Line type="monotone" dataKey="execution" stroke="var(--mint)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-semibold text-text mb-4">System Load</h3>
            <div className="grid grid-cols-2 gap-4">
              <LoadCard label="CPU Usage" value={`${systemMetrics?.cpu_usage_percent ?? 0}%`} />
              <LoadCard label="Memory Usage" value={`${systemMetrics?.memory_usage_percent ?? 0}%`} />
              <LoadCard label="Compile Avg" value={`${jobMetrics?.average_compile_time_ms ?? 0} ms`} />
              <LoadCard label="Execution Avg" value={`${jobMetrics?.average_execution_time_ms ?? 0} ms`} />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  sublabel,
}: {
  icon: ReactNode;
  title: string;
  value: string | number;
  sublabel: string;
}) {
  return (
    <GlassCard hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-tertiary text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-text">{value}</p>
          <p className="text-xs text-text-secondary mt-1">{sublabel}</p>
        </div>
        <div className="p-3 bg-sky/20 rounded-xl">{icon}</div>
      </div>
    </GlassCard>
  );
}

function LoadCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-divider-subtle bg-surface-solid p-4">
      <p className="text-xs uppercase tracking-wide text-text-tertiary mb-1">{label}</p>
      <p className="text-2xl font-bold text-text">{value}</p>
    </div>
  );
}
