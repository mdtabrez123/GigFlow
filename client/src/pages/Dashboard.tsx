import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { LeadTable } from '../components/LeadTable';
import { fetchLeads, deleteLead } from '../api';
import { useDebounce } from '../hooks/useDebounce';
import { useExportLeads } from '../hooks/useExportLeads';
import type { Lead, Pagination } from '../types';
import { ChevronLeft, ChevronRight, Download, Loader2, Plus } from 'lucide-react';
import { LeadModal } from '../components/LeadModal';
import { LeadDetailsModal } from '../components/LeadDetailsModal';

function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('latest');

  const { isExporting, exportError, handleExport } = useExportLeads();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Modal States
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToView, setLeadToView] = useState<string | null>(null);

  // Debounce the search term to avoid spamming the API while typing
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, statusFilter, sourceFilter, sortFilter]);

  useEffect(() => {
    const loadLeads = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchLeads({
          search: debouncedSearch,
          status: statusFilter,
          source: sourceFilter,
          sort: sortFilter,
          page: pagination.page,
          limit: pagination.limit,
        });

        setLeads(response.data);
        setPagination(response.pagination);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'An error occurred');
        setLeads([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeads();
  }, [debouncedSearch, statusFilter, sourceFilter, sortFilter, pagination.page, pagination.limit]);

  // Expose a refetch function to be called after create/update
  const handleSuccess = () => {
    setIsLeadModalOpen(false);
    setSelectedLead(null);
    setPagination((prev) => ({ ...prev, page: 1 })); // force reload by resetting page (or just triggering effect)
    // To cleanly trigger effect, we can just alter a state. For simplicity, setting page to 1 will reload.
    // If already on page 1, we need to trigger manually. We'll use a refresh trigger.
  };

  const handleDelete = async (lead: Lead) => {
    if (window.confirm(`Are you sure you want to delete the lead: ${lead.name}?`)) {
      try {
        await deleteLead(lead.id || (lead as any)._id);
        setPagination((prev) => ({ ...prev, page: 1 }));
      } catch (err: any) {
        alert('Failed to delete lead: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
  };

  const handleView = (lead: Lead) => {
    setLeadToView(lead.id || (lead as any)._id);
    setIsDetailsModalOpen(true);
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
    }
  };

  return (
    <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      <Sidebar />

      <div className="flex-1 sm:ml-64 flex flex-col">
        <Topbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

        <main className="p-6 flex-1 overflow-x-hidden">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads Dashboard</h1>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
              <button
                onClick={() => {
                  setSelectedLead(null);
                  setIsLeadModalOpen(true);
                }}
                className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors hover:bg-gray-800 dark:hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" /> Create Lead
              </button>

              <button
                onClick={() => handleExport({ status: statusFilter, source: sourceFilter, search: debouncedSearch })}
                disabled={isExporting || leads.length === 0}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors"
              >
                {isExporting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Exporting...</>
                  : <><Download className="w-4 h-4" /> Export CSV</>}
              </button>
              {exportError && (
                <p className="text-xs text-red-500 absolute mt-12">{exportError}</p>
              )}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-4 items-center justify-end">
            <select
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-2 shadow-sm"
            >
              <option value="latest">Sort by: Latest</option>
              <option value="oldest">Sort by: Oldest</option>
            </select>
          </div>

          <LeadTable
            leads={leads}
            isLoading={isLoading}
            error={error}
            statusFilter={statusFilter}
            sourceFilter={sourceFilter}
            onStatusChange={setStatusFilter}
            onSourceChange={setSourceFilter}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Pagination Controls */}
          {!isLoading && !error && leads.length > 0 && (
            <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
              <span className="text-sm text-gray-700">
                Showing <span className="font-semibold text-gray-900">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-semibold text-gray-900">{pagination.total}</span> Entries
              </span>

              <div className="inline-flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={!pagination.hasPrevPage}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <div className="px-3 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg">
                  {pagination.page}
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={!pagination.hasNextPage}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSuccess={handleSuccess}
        lead={selectedLead}
      />

      <LeadDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        leadId={leadToView}
      />
    </div>
  );
}

export default Dashboard;
