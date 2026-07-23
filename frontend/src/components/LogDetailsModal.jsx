import { useEffect, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { SeverityBadge, StatusBadge } from './Badges';

export default function LogDetailsModal({ log, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!log) return null;

  const jsonPayload = JSON.stringify(
    {
      actor: log.actor,
      role: log.role,
      action: log.action,
      resource: log.resource,
      resourceType: log.resourceType,
      ipAddress: log.ipAddress,
      region: log.region,
      severity: log.severity,
      status: log.status,
      timestamp: log.timestamp,
    },
    null,
    2
  );

  const copyJson = () => {
    navigator.clipboard.writeText(jsonPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const fields = [
    ['Actor', log.actor],
    ['Role', log.role],
    ['Action', log.action],
    ['Resource', log.resource],
    ['Resource Type', log.resourceType],
    ['IP Address', log.ipAddress],
    ['Region', log.region],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Log Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-5">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={log.severity} />
            <StatusBadge status={log.status} />
            <span className="text-xs text-gray-400 ml-auto">
              {new Date(log.timestamp).toLocaleString()}
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-400">{label}</dt>
                <dd className="text-sm text-gray-800 font-medium break-all">{value}</dd>
              </div>
            ))}
          </dl>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400">JSON Payload</span>
              <button
                onClick={copyJson}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="bg-navy-900 text-slate-200 text-xs rounded-lg p-4 overflow-x-auto leading-relaxed">
{jsonPayload}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
