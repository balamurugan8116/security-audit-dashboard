const SEVERITY_STYLES = {
  HIGH: 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-200',
  MEDIUM: 'bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200',
  LOW: 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200',
};

const STATUS_STYLES = {
  Resolved: 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200',
  Unresolved: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
};

export function SeverityBadge({ severity }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
        SEVERITY_STYLES[severity] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {severity}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
        STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {status}
    </span>
  );
}
