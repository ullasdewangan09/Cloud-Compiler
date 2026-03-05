import { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Loader2, AlertCircle, Activity, Server, Database, Cpu } from 'lucide-react';
import { apiService } from '../../services/api';

interface DashboardData {
  system_state: {
    queue_length: number;
    active_workers: number;
    running_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
  };
  queue_metrics: {
    queue_length: number;
  };
  worker_metrics: {
    active_workers: number;
    workers: Record<string, { status: string; current_job: string | null }>;
  };
  system_metrics: {
    cpu_usage_percent: number;
    memory_usage_percent: number;
  };
  recent_executions: Array<{
    user: string;
    language: string;
    status: string;
  }>;
}

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 3000);
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
  const recentExecutions = dashboardData?.recent_executions || [];

  const workers = workerMetrics?.workers || {};
  const workerList = Object.entries(workers);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">System Visualization</h1>
          <p className="text-text-secondary">
            Real-time distributed architecture and execution flow
          </p>
        </div>

        <GlassCard className="mb-6">
          <h3 className="text-lg font-semibold text-text mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Distributed System Architecture
          </h3>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="p-4 rounded-xl border-2 bg-primary/10 border-primary shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Server className="w-5 h-5 text-sky" />
                <div>
                  <h4 className="font-semibold text-text">API Service</h4>
                  <p className="text-xs text-text-tertiary">FastAPI</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-text-secondary">
                  CPU: {systemMetrics?.cpu_usage_percent ?? 0}%
                </p>
                <p className="text-xs text-text-secondary">
                  Memory: {systemMetrics?.memory_usage_percent ?? 0}%
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border-2 bg-primary/10 border-primary shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-mint" />
                <div>
                  <h4 className="font-semibold text-text">Redis Queue</h4>
                  <p className="text-xs text-text-tertiary">Job Buffer</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-text-secondary">
                  Queue Length: {queueMetrics?.queue_length ?? 0}
                </p>
                <p className="text-xs text-text-secondary">
                  Running Jobs: {systemState?.running_jobs ?? 0}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border-2 bg-primary/10 border-primary shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Cpu className="w-5 h-5 text-lavender" />
                <div>
                  <h4 className="font-semibold text-text">Workers</h4>
                  <p className="text-xs text-text-tertiary">Executor Pool</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-text-secondary">
                  Active: {workerMetrics?.active_workers ?? 0}
                </p>
                <p className="text-xs text-text-secondary">
                  Registered: {workerList.length}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-divider pt-6">
            <h4 className="text-sm font-semibold text-text mb-3">Worker Status</h4>
            <div className="space-y-2">
              {workerList.length === 0 && (
                <div className="p-3 bg-surface-solid rounded-lg text-sm text-text-secondary">
                  No workers registered yet.
                </div>
              )}
              {workerList.map(([workerId, worker], idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-surface-solid rounded-lg"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      worker.status === 'running' ? 'bg-primary animate-pulse' : 'bg-divider'
                    }`}
                  />
                  <span className="text-sm text-text">{workerId}</span>
                  <span className="ml-auto text-xs text-text-tertiary">{worker.status}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Recent Executions
          </h3>
          {recentExecutions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">No recent executions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExecutions.map((job, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-surface-solid rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        job.status === 'submitted'
                          ? 'bg-status-warning'
                          : job.status === 'success'
                            ? 'bg-status-success'
                            : 'bg-status-error'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-text">{job.user}</p>
                      <p className="text-xs text-text-tertiary">{job.language}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text">{job.status}</p>
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
