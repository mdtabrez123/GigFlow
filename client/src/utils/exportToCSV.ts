// ─────────────────────────────────────────────────────────────────────────────
// src/utils/exportToCSV.ts
// Converts an array of Lead objects into a downloadable CSV file.
// ─────────────────────────────────────────────────────────────────────────────

import type { Lead } from '../types';
import { format } from 'date-fns';

// ─── CSV Column Definitions ───────────────────────────────────────────────────

/**
 * Defines the exported columns in order.
 * Each entry maps a human-readable header to a getter function on Lead.
 *
 * Extending the export: just add a new entry here — no other code changes needed.
 */
const CSV_COLUMNS: { header: string; getValue: (lead: Lead) => string }[] = [
  { header: 'ID',          getValue: (l) => l.id },
  { header: 'Name',        getValue: (l) => l.name },
  { header: 'Email',       getValue: (l) => l.email },
  { header: 'Status',      getValue: (l) => l.status },
  { header: 'Source',      getValue: (l) => l.source },
  { header: 'Notes',       getValue: (l) => l.notes ?? '' },
  {
    header: 'Assigned To',
    getValue: (l) => l.assignedTo ? `${l.assignedTo.name} (${l.assignedTo.email})` : 'Unassigned',
  },
  {
    header: 'Created At',
    getValue: (l) => {
      try {
        return format(new Date(l.createdAt), 'yyyy-MM-dd HH:mm:ss');
      } catch {
        return l.createdAt;
      }
    },
  },
];

// ─── Core Helpers ─────────────────────────────────────────────────────────────

/**
 * Escapes a single CSV cell value.
 *
 * RFC 4180 rules applied:
 *  - Wrap in double-quotes if the value contains a comma, double-quote, or newline.
 *  - Escape internal double-quotes by doubling them ("" → represents one ").
 *  - Trim leading/trailing whitespace to avoid padding artifacts.
 */
const escapeCell = (raw: string): string => {
  const value = String(raw).trim();
  const needsQuoting = /[",\n\r]/.test(value);

  if (!needsQuoting) return value;
  return `"${value.replace(/"/g, '""')}"`;
};

/**
 * Serialises an array of Lead objects into a valid RFC 4180 CSV string.
 *
 * @param leads   Array of Lead objects to serialise.
 * @returns       A multi-line CSV string with a header row.
 */
const buildCSVString = (leads: Lead[]): string => {
  // Header row
  const headerRow = CSV_COLUMNS.map((col) => escapeCell(col.header)).join(',');

  // Data rows
  const dataRows = leads.map((lead) =>
    CSV_COLUMNS.map((col) => escapeCell(col.getValue(lead))).join(',')
  );

  return [headerRow, ...dataRows].join('\r\n'); // CRLF per RFC 4180
};

// ─── Main Export Function ─────────────────────────────────────────────────────

/**
 * Converts an array of Lead objects into a CSV file and triggers a
 * browser download without any server round-trip.
 *
 * Mechanism:
 *   1. Serialise leads → CSV string.
 *   2. Wrap in a Blob with the correct MIME type.
 *   3. Create an object URL and programmatically click a hidden <a> tag.
 *   4. Immediately revoke the object URL to free memory.
 *
 * @param leads     Array of Lead objects to export.
 * @param filename  Optional filename (without .csv extension). Defaults to
 *                  "gigflow-leads-YYYY-MM-DD".
 *
 * @throws {Error}  If `leads` is not a non-empty array.
 *
 * @example
 * exportToCSV(leads);
 * exportToCSV(leads, 'q2-report');
 */
export const exportToCSV = (leads: Lead[], filename?: string): void => {
  if (!Array.isArray(leads) || leads.length === 0) {
    throw new Error('exportToCSV: no leads to export. Please ensure the leads array is non-empty.');
  }

  // ── 1. Build CSV content ───────────────────────────────────────────────
  const csvContent = buildCSVString(leads);

  // ── 2. Create Blob (UTF-8 BOM so Excel opens it correctly) ────────────
  //   The BOM (\uFEFF) tells Excel the file is UTF-8 encoded, preventing
  //   garbled characters for names with accents or non-ASCII characters.
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  // ── 3. Build dynamic filename ──────────────────────────────────────────
  const dateStamp = format(new Date(), 'yyyy-MM-dd');
  const resolvedFilename = filename
    ? `${filename}.csv`
    : `gigflow-leads-${dateStamp}.csv`;

  // ── 4. Trigger browser download ────────────────────────────────────────
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.setAttribute('href', url);
  anchor.setAttribute('download', resolvedFilename);
  anchor.style.visibility = 'hidden';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // ── 5. Release object URL ──────────────────────────────────────────────
  // Defer revoke so the browser has time to initiate the download.
  setTimeout(() => URL.revokeObjectURL(url), 100);
};
