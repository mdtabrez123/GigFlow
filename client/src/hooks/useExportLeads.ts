// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/useExportLeads.ts
// React hook that fetches ALL matching leads (ignoring pagination) and
// triggers a CSV download via exportToCSV().
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { fetchLeads } from '../api';
import { exportToCSV } from '../utils/exportToCSV';

interface ExportOptions {
  /** Currently active status filter — forwarded to the API */
  status?: string;
  /** Currently active source filter — forwarded to the API */
  source?: string;
  /** Currently active search term — forwarded to the API */
  search?: string;
  /** Optional custom filename (without .csv extension) */
  filename?: string;
}

interface UseExportLeadsReturn {
  /** True while the export fetch + processing is in progress */
  isExporting: boolean;
  /** Non-null when the last export attempt failed */
  exportError: string | null;
  /**
   * Call this to start the export.
   * It fetches all leads matching the current filters (limit: 10,000)
   * and initiates a CSV download automatically.
   */
  handleExport: (options?: ExportOptions) => Promise<void>;
}

/**
 * useExportLeads
 *
 * Encapsulates the full export flow:
 *   1. Fetches all leads (up to 10,000) that match the active filters.
 *   2. Passes them to `exportToCSV()` which triggers a browser download.
 *
 * This keeps the export logic completely decoupled from the paginated table.
 *
 * @example
 * const { isExporting, exportError, handleExport } = useExportLeads();
 *
 * <button onClick={() => handleExport({ status: 'New', search: 'john' })}>
 *   Export
 * </button>
 */
export function useExportLeads(): UseExportLeadsReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = useCallback(async (options: ExportOptions = {}) => {
    setIsExporting(true);
    setExportError(null);

    try {
      // Fetch all matching leads — high limit bypasses pagination.
      // The backend caps at 100 per our server config; adjust as needed.
      const response = await fetchLeads({
        status: options.status,
        source: options.source,
        search: options.search,
        limit: 10_000, // Large enough to capture all leads in practice
        page: 1,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No leads found matching the current filters.');
      }

      exportToCSV(response.data, options.filename);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Export failed. Please try again.';
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { isExporting, exportError, handleExport };
}
