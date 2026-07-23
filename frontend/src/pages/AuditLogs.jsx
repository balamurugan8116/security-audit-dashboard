import { useEffect, useMemo, useState } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, X, Eye } from 'lucide-react';
import { fetchLogs, fetchMeta } from '../api/client';
import { SeverityBadge, StatusBadge } from '../components/Badges';
import Pagination from '../components/Pagination';
import LogDetailsModal from '../components/LogDetailsModal';

const DEFAULT_FILTERS = {
  search: '',
  role: 'All',
  severity: 'All',
  status: 'All',
  region: 'All',
};

const COLUMNS = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'actor', label: 'Actor' },
  { key: 'role', label: 'Role' },
  { key: 'action', label: 'Action' },
  { key: 'resource', label: 'Resource' },
  { key: 'severity', label: 'Severity' },
  { key: 'status', label: 'Status' },
  { key: 'region', label: 'Region' },
];

export default function AuditLogs() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [meta, setMeta] = useState({ roles: [], severities: [], statuses: [], regions: [] });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [sortBy, setSortBy] = useState('timestamp');
  const [order, setOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  // Debounce the free-text search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput }));
      setPagination((p) => ({ ...p, page: 1 }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fetchMeta().then(setMeta).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchLogs({
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search || undefined,
      role: filters.role,
      severity: filters.severity,
      status: filters.status,
      region: filters.region,
      sortBy,
      order,
    })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setPagination(res.pagination);
      })
      .catch(() => !cancelled && setError('Could not load logs. Is the API running?'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page, pagination.limit, sortBy, order]);

  const activeFilterCount = useMemo(
    () => Object.entries(filters).filter(([k, v]) => k !== 'search' && v !== 'All').length,
    [filters]
  );

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput('');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown size={12} className="text-gray-300" />;
    return order === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-card">
        {/* Filter bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search actor, action, resource, IP…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-brand-500 outline-none"
            />
          </div>

          <FilterSelect label="Role" value={filters.role} options={meta.roles} onChange={(v) => updateFilter('role', v)} />
          <FilterSelect
            label="Severity"
            value={filters.severity}
            options={meta.severities}
            onChange={(v) => updateFilter('severity', v)}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            options={meta.statuses}
            onChange={(v) => updateFilter('status', v)}
          />
          <FilterSelect
            label="Region"
            value={filters.region}
            options={meta.regions}
            onChange={(v) => updateFilter('region', v)}
          />

          {(activeFilterCount > 0 || filters.search) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 shrink-0"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {error && <div className="p-4 text-sm text-red-600">{error}</div>}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                {COLUMNS.map((col) => (
                  <th key={col.key} className="px-4 py-3 font-medium whitespace-nowrap">
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-1 hover:text-gray-800"
                    >
                      {col.label}
                      <SortIcon field={col.key} />
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-4 py-10 text-center text-gray-400">
                    Loading logs…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-4 py-10 text-center text-gray-400">
                    No logs match your filters.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((log) => (
                  <tr key={log._id} className="border-b border-gray-50 hover:bg-gray-50/70">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{log.actor}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{log.role}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{log.action}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.resource}</td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={log.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">{log.region}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-brand-600"
                        aria-label="View details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
          onLimitChange={(l) => setPagination((prev) => ({ ...prev, page: 1, limit: l }))}
        />
      </div>

      <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}

function FilterSelect({ label, value, options = [], onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white shrink-0"
    >
      <option value="All">{label}: All</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
