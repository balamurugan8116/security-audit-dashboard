import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileJson, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { parseLogFile, MAX_FILE_SIZE_MB } from '../utils/parseFile';
import { bulkUploadLogs } from '../api/client';

const STAGES = { IDLE: 'idle', PARSING: 'parsing', UPLOADING: 'uploading', DONE: 'done', ERROR: 'error' };

export default function UploadLogs() {
  const [stage, setStage] = useState(STAGES.IDLE);
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const reset = () => {
    setStage(STAGES.IDLE);
    setFileName('');
    setProgress(0);
    setResult(null);
    setWarnings([]);
    setErrorMsg('');
  };

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    reset();
    setFileName(file.name);

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setStage(STAGES.ERROR);
      setErrorMsg(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    try {
      setStage(STAGES.PARSING);
      const { logs, warnings: parseWarnings } = await parseLogFile(file);
      setWarnings(parseWarnings);

      setStage(STAGES.UPLOADING);
      const data = await bulkUploadLogs(logs, setProgress);
      setResult(data);
      setStage(STAGES.DONE);
    } catch (err) {
      setStage(STAGES.ERROR);
      setErrorMsg(err.response?.data?.message || err.message || 'Upload failed');
    }
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const busy = stage === STAGES.PARSING || stage === STAGES.UPLOADING;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
        <h2 className="font-semibold text-gray-900">Upload Audit Logs</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload a JSON or CSV file containing audit log records. Records are validated and inserted
          in a single bulk request &mdash; supports 10,000+ records per file.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !busy && inputRef.current?.click()}
          className={`mt-5 border-2 border-dashed rounded-xl py-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
            ${dragOver ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300'}
            ${busy ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center mb-3">
            <UploadCloud size={26} />
          </div>
          <p className="text-sm font-medium text-gray-700">Drag and drop your file here</p>
          <p className="text-xs text-gray-400 mt-1">or click to browse</p>
          <p className="text-xs text-gray-400 mt-3">Supports JSON and CSV files, max {MAX_FILE_SIZE_MB}MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".json,.csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        {fileName && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <FileJson size={16} className="text-gray-400" />
            <span className="truncate">{fileName}</span>
          </div>
        )}

        {stage === STAGES.PARSING && (
          <p className="mt-3 text-sm text-brand-600">Parsing file…</p>
        )}

        {stage === STAGES.UPLOADING && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Uploading…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {stage === STAGES.ERROR && (
          <div className="mt-4 flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-lg p-3">
            <XCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {stage === STAGES.DONE && result && (
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-2 bg-emerald-50 text-emerald-700 text-sm rounded-lg p-3">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>
                Upload complete. {result.success.toLocaleString()} of {result.totalReceived.toLocaleString()} records
                inserted successfully{result.failed > 0 ? `, ${result.failed} failed.` : '.'}
              </span>
            </div>

            {warnings.length > 0 && (
              <details className="bg-amber-50 text-amber-700 text-xs rounded-lg p-3">
                <summary className="cursor-pointer font-medium flex items-center gap-2">
                  <AlertTriangle size={14} /> {warnings.length} row(s) had missing fields
                </summary>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </details>
            )}

            {result.errors?.length > 0 && (
              <details className="bg-red-50 text-red-700 text-xs rounded-lg p-3">
                <summary className="cursor-pointer font-medium">
                  {result.errors.length} record(s) rejected by the server
                </summary>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  {result.errors.slice(0, 10).map((e, i) => (
                    <li key={i}>
                      Row {e.index}: {e.message}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <button
              onClick={reset}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Upload another file
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Expected format</h3>
        <p className="text-xs text-gray-500 mb-2">
          JSON: either a bare array of log objects, or <code className="bg-gray-100 px-1 rounded">{'{ "logs": [...] }'}</code>. CSV: first row is the header, matching the field names below.
        </p>
        <pre className="bg-navy-900 text-slate-200 text-xs rounded-lg p-4 overflow-x-auto leading-relaxed">
{`{
  "actor": "priya.nair@company.com",
  "role": "admin",
  "action": "DELETE_USER",
  "resource": "/api/users/334",
  "resourceType": "USER",
  "ipAddress": "192.168.1.45",
  "region": "ap-south-1",
  "severity": "HIGH",
  "status": "Unresolved",
  "timestamp": "2025-06-14T08:32:11Z"
}`}
        </pre>
      </div>
    </div>
  );
}
