import { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Activity, Cpu, Database, Clock, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { apiService } from '../../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface QueueMetrics {
  queue_length: number;
}

interface WorkerMetrics {
  active_workers: number;
  workers: Record<string, { status: string; current_job: string | null }>;
}

interface SystemMetrics {
  cpu_usage_percent: number;
  memory_usage_percent: number;
}

interface JobMetrics {
  completed_jobs: number;
  failed_jobs: number;
}

export function Metrics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [workerMetrics, setWorkerMetrics] = useState<WorkerMetrics | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [jobMetrics, setJobMetrics] = useState<JobMetrics | null>(null);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000); // Refresh every 5 seconds
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
  const totalJobs = (jobMetrics?.completed_jobs ?? 0) + (jobMetrics?.failed_jobs ?? 0);
  const successJobs = jobMetrics?.completed_jobs ?? 0;
  const failedJobs = jobMetrics?.failed_jobs ?? 0;
  const successRate = totalJobs > 0 ? Math.round((successJobs / totalJobs) * 100) : 0;

  const statusDistributionData = [
    { status: 'Completed', count: successJobs },
    { status: 'Failed', count: failedJobs },
  ];

  const executionTimeTrendData = [
    { time: 'CPU', ms: Math.round(systemMetrics?.cpu_usage_percent ?? 0) },
    { time: 'Memory', ms: Math.round(systemMetrics?.memory_usage_percent ?? 0) },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">System Metrics</h1>
          <p className="text-text-secondary">Real-time monitoring and performance analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <GlassCard hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-text-tertiary text-sm mb-1">Queue Depth</p>
                <p className="text-3xl font-bold text-text">
                  {queueLength}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  queued jobs
                </p>
              </div>
              <div className="p-3 bg-sky/20 rounded-xl">
                <Database className="w-6 h-6 text-sky-deep" />
              </div>
            </div>
          </GlassCard>

          <GlassCard hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-text-tertiary text-sm mb-1">Active Workers</p>
                <p className="text-3xl font-bold text-text">
                  {workerCount}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  registered workers
                </p>
              </div>
              <div className="p-3 bg-mint/20 rounded-xl">
                <Cpu className="w-6 h-6 text-mint-deep" />
              </div>
            </div>
          </GlassCard>

          <GlassCard hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-text-tertiary text-sm mb-1">Total Jobs</p>
                <p className="text-3xl font-bold text-text">
                  {totalJobs}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {successJobs} completed
                </p>
              </div>
              <div className="p-3 bg-lavender/20 rounded-xl">
                <Activity className="w-6 h-6 text-lavender-deep" />
              </div>
            </div>
          </GlassCard>

          <GlassCard hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-text-tertiary text-sm mb-1">Avg Exec Time</p>
                <p className="text-3xl font-bold text-text">
                  {successRate}
                  <span className="text-lg">%</span>
                </p>
                <p className="text-xs text-text-secondary mt-1">success rate</p>
              </div>
              <div className="p-3 bg-peach/20 rounded-xl">
                <Clock className="w-6 h-6 text-peach-deep" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Job Status Distribution */}
          <GlassCard>
            <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Job Status Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusDistributionData}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
                  <XAxis dataKey="status" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-solid)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="var(--sky)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Execution Time Trend */}
          <GlassCard>
            <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Execution Time Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={executionTimeTrendData}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
                  <XAxis dataKey="time" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-solid)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ms"
                    stroke="var(--mint)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--mint-deep)', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* System Info */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-text mb-4">System Information</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-text-tertiary mb-1">CPU Usage</p>
              <p className="text-2xl font-bold text-text">
                {systemMetrics?.cpu_usage_percent ?? 0}%
              </p>
            </div>
            <div>
              <p className="text-sm text-text-tertiary mb-1">Memory Usage</p>
              <p className="text-2xl font-bold text-text">
                {systemMetrics?.memory_usage_percent ?? 0}%
              </p>
            </div>
            <div>
              <p className="text-sm text-text-tertiary mb-1">Queue Length</p>
              <p className="text-2xl font-bold text-text">
                {queueLength}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
