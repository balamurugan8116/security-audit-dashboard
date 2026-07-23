import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { FileText, ShieldAlert, ShieldQuestion, ShieldCheck } from 'lucide-react';
import { fetchStats } from '../api/client';
import StatCard from '../components/StatCard';

const SEVERITY_COLORS = { HIGH: '#E5484D', MEDIUM: '#F5A524', LOW: '#12B76A' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchStats()
      .then((data) => !cancelled && setStats(data))
      .catch(() => !cancelled && setError('Could not load dashboard stats. Is the API running?'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading dashboard…</div>;
  }
  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }
  if (!stats || stats.total === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-gray-500">No logs yet. Upload a batch to see your dashboard come to life.</p>
      </div>
    );
  }

  const severityData = ['HIGH', 'MEDIUM', 'LOW'].map((s) => ({
    name: s,
    value: stats.severity[s] || 0,
  }));
  const resolved = stats.status.Resolved || 0;
  const unresolved = stats.status.Unresolved || 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Logs" value={stats.total.toLocaleString()} icon={FileText} accent="brand" />
        <StatCard label="High Severity" value={(stats.severity.HIGH || 0).toLocaleString()} icon={ShieldAlert} accent="red" />
        <StatCard label="Unresolved Incidents" value={unresolved.toLocaleString()} icon={ShieldQuestion} accent="amber" />
        <StatCard label="Resolved Incidents" value={resolved.toLocaleString()} icon={ShieldCheck} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 xl:col-span-2">
          <h3 className="font-semibold text-gray-800 text-sm mb-1">Logs Over Time</h3>
          <p className="text-xs text-gray-400 mb-4">Daily log volume</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.dailyCounts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2F6FED" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-1">Severity Distribution</h3>
          <p className="text-xs text-gray-400 mb-4">Share of all logs</p>
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {severityData.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-gray-900">{stats.total.toLocaleString()}</span>
              <span className="text-xs text-gray-400">Total</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {severityData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[s.name] }} />
                {s.name} ({stats.total ? Math.round((s.value / stats.total) * 100) : 0}%)
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Top Actions</h3>
          <div className="space-y-3">
            {stats.topActions.map((a) => {
              const max = stats.topActions[0]?.count || 1;
              return (
                <div key={a.action}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">{a.action}</span>
                    <span>{a.count.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${(a.count / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Top Regions</h3>
          <div className="space-y-3">
            {stats.topRegions.map((r) => {
              const max = stats.topRegions[0]?.count || 1;
              return (
                <div key={r.region}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">{r.region}</span>
                    <span>{r.count.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(r.count / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
