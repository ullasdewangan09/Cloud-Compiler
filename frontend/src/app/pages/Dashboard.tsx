import { ReactNode, useEffect, useState } from 'react';
import { Activity, AlertCircle, Database, Loader2, Server, TimerReset } from 'lucide-react';

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
  }>;
}

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
        setError('Access denied. Admin privileges required.');
      } else {
        setError('Failed to load dashboard: ' + err.message);
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
          <p className="text-text-secondary">Loading dashboard...</p>
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

  const systemState = dashboardData?.system_state;
  const queueMetrics = dashboardData?.queue_metrics;
  const workerMetrics = dashboardData?.worker_metrics;
  const systemMetrics = dashboardData?.system_metrics;
  const jobMetrics = dashboardData?.job_metrics;
  const recentExecutions = dashboardData?.recent_executions || [];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Execution Dashboard</h1>
          <p className="text-text-secondary">Realtime view of queueing, workers, and recent execution outcomes</p>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-6">
          <SnapshotCard title="Queue" value={`${queueMetrics?.queue_length ?? 0}`} subtitle={`${queueMetrics?.average_queue_wait_ms ?? 0} ms avg wait`} icon={<Database className="w-5 h-5 text-sky-deep" />} />
          <SnapshotCard title="Workers" value={`${workerMetrics?.active_workers ?? 0}`} subtitle={`${workerMetrics?.running_jobs ?? 0} running`} icon={<Server className="w-5 h-5 text-mint-deep" />} />
          <SnapshotCard title="Success Rate" value={`${systemState?.success_rate_percent ?? 0}%`} subtitle={`${systemState?.completed_jobs ?? 0} successes`} icon={<Activity className="w-5 h-5 text-lavender-deep" />} />
          <SnapshotCard title="Avg Total Time" value={`${systemState?.average_total_time_ms ?? 0} ms`} subtitle={`${jobMetrics?.average_execution_time_ms ?? 0} ms execution`} icon={<TimerReset className="w-5 h-5 text-peach-deep" />} />
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <GlassCard>
            <h3 className="text-lg font-semibold text-text mb-4">Platform Health</h3>
            <div className="space-y-3">
              <HealthRow label="CPU usage" value={`${systemMetrics?.cpu_usage_percent ?? 0}%`} />
              <HealthRow label="Memory usage" value={`${systemMetrics?.memory_usage_percent ?? 0}%`} />
              <HealthRow label="Compile average" value={`${jobMetrics?.average_compile_time_ms ?? 0} ms`} />
              <HealthRow label="Execution average" value={`${jobMetrics?.average_execution_time_ms ?? 0} ms`} />
            </div>
          </GlassCard>

          <GlassCard className="col-span-2">
            <h3 className="text-lg font-semibold text-text mb-4">Worker Pool</h3>
            <div className="space-y-2">
              {Object.entries(workerMetrics?.workers || {}).length === 0 ? (
                <div className="p-3 bg-surface-solid rounded-lg text-sm text-text-secondary">
                  No workers registered yet.
                </div>
              ) : (
                Object.entries(workerMetrics?.workers || {}).map(([workerId, worker]) => (
                  <div key={workerId} className="flex items-center gap-3 p-3 bg-surface-solid rounded-lg">
                    <div className={`w-2.5 h-2.5 rounded-full ${worker.status === 'running' ? 'bg-status-warning animate-pulse' : 'bg-status-success'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">{workerId}</p>
                      <p className="text-xs text-text-tertiary">{worker.current_job || 'idle'}</p>
                    </div>
                    <span className="ml-auto text-xs uppercase tracking-wide text-text-tertiary">{worker.status}</span>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <h3 className="text-lg font-semibold text-text mb-4">Recent Executions</h3>
          {recentExecutions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">No recent executions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExecutions.map((job, index) => (
                <div key={`${job.user}-${index}`} className="flex items-center justify-between rounded-xl bg-surface-solid p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        job.status === 'success'
                          ? 'bg-status-success'
                          : job.status === 'running'
                            ? 'bg-status-warning'
                            : 'bg-status-error'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-text">{job.user}</p>
                      <p className="text-xs text-text-tertiary">{job.language} · {job.status}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-text-tertiary">
                    <p>{job.total_time_ms != null ? `${job.total_time_ms} ms total` : 'pending'}</p>
                    <p>{job.queue_wait_ms != null ? `${job.queue_wait_ms} ms queue` : job.error || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function SnapshotCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <GlassCard hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-tertiary mb-1">{title}</p>
          <p className="text-3xl font-bold text-text">{value}</p>
          <p className="text-xs text-text-secondary mt-1">{subtitle}</p>
        </div>
        <div className="p-3 rounded-xl bg-sky/20">{icon}</div>
      </div>
    </GlassCard>
  );
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-divider-subtle bg-surface-solid px-3 py-2">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-semibold text-text">{value}</span>
    </div>
  );
}
