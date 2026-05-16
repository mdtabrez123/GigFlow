import React from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';
import type { Lead, LeadStatus, LeadSource } from '../types';
import { Loader2, AlertCircle, FileX2, Eye, Edit2, Trash2 } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
  statusFilter: string;
  sourceFilter: string;
  onStatusChange: (val: string) => void;
  onSourceChange: (val: string) => void;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

const statusColors: Record<LeadStatus, string> = {
  New: 'bg-blue-100 text-blue-800 border-blue-200',
  Contacted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Qualified: 'bg-green-100 text-green-800 border-green-200',
  Lost: 'bg-red-100 text-red-800 border-red-200',
};

const sourceColors: Record<LeadSource, string> = {
  Website: 'bg-purple-100 text-purple-800',
  Instagram: 'bg-pink-100 text-pink-800',
  Referral: 'bg-indigo-100 text-indigo-800',
};

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  isLoading,
  error,
  statusFilter,
  sourceFilter,
  onStatusChange,
  onSourceChange,
  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Table Header & Filters */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Leads</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track your incoming leads</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Lost">Lost</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => onSourceChange(e.target.value)}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
          >
            <option value="">All Sources</option>
            <option value="Website">Website</option>
            <option value="Instagram">Instagram</option>
            <option value="Referral">Referral</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th scope="col" className="px-6 py-4">Lead Name</th>
              <th scope="col" className="px-6 py-4">Status</th>
              <th scope="col" className="px-6 py-4">Source</th>
              <th scope="col" className="px-6 py-4">Created Date</th>
              <th scope="col" className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
                    <p>Loading leads...</p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-red-500">
                    <AlertCircle className="w-10 h-10 mb-3 text-red-400" />
                    <p className="font-medium text-red-600">Failed to load data</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <FileX2 className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white">No leads found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id || lead._id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 dark:text-white">{lead.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{lead.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx('px-2.5 py-1 text-xs font-medium rounded-full border', statusColors[lead.status])}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx('px-2.5 py-1 text-xs font-medium rounded-md', sourceColors[lead.source])}>
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(lead)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(lead)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Lead"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(lead)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
