const REQUIRED_FIELDS = [
  'actor',
  'role',
  'action',
  'resource',
  'resourceType',
  'ipAddress',
  'region',
  'severity',
  'status',
  'timestamp',
];

/**
 * Minimal CSV parser (no external dependency) tailored to this exercise's
 * flat, comma-delimited log format. Handles quoted fields and escaped
 * quotes ("") since actor/resource values could theoretically contain
 * commas. Not a general-purpose RFC4180 parser, but sufficient for a
 * well-formed export produced by the same dashboard.
 */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      }
      if (char === '\r' && next === '\n') i++;
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? '').trim();
    });
    return obj;
  });
}

function validateLogs(logs) {
  const errors = [];
  logs.forEach((log, idx) => {
    const missing = REQUIRED_FIELDS.filter((f) => log[f] === undefined || log[f] === '');
    if (missing.length) {
      errors.push(`Row ${idx + 1}: missing field(s) ${missing.join(', ')}`);
    }
  });
  return errors;
}

/**
 * Reads a File (JSON or CSV) and resolves to { logs, warnings }.
 * JSON files may be either a bare array of logs or { logs: [...] }.
 */
export function parseLogFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.onload = () => {
      try {
        const text = reader.result;
        let logs;

        if (file.name.toLowerCase().endsWith('.json')) {
          const parsed = JSON.parse(text);
          logs = Array.isArray(parsed) ? parsed : parsed.logs;
          if (!Array.isArray(logs)) {
            throw new Error('JSON must be an array of logs or an object with a "logs" array');
          }
        } else if (file.name.toLowerCase().endsWith('.csv')) {
          logs = parseCSV(text);
        } else {
          throw new Error('Unsupported file type. Please upload a .json or .csv file');
        }

        const warnings = validateLogs(logs).slice(0, 20);
        resolve({ logs, warnings, totalRows: logs.length });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}

export const MAX_FILE_SIZE_MB = 50;
