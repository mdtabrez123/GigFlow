import React, { useState, useEffect } from 'react';
import { X, Loader2, Mail, Calendar, User, Tag, Globe, FileText } from 'lucide-react';
import type { Lead } from '../types';
import { getLead } from '../api';
import { format } from 'date-fns';
import clsx from 'clsx';

interface LeadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string | null;
}

const statusColors: Record<string, string> = {
  New: 'bg-blue-100 text-blue-800 border-blue-200',
  Contacted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Qualified: 'bg-green-100 text-green-800 border-green-200',
  Lost: 'bg-red-100 text-red-800 border-red-200',
};

const sourceColors: Record<string, string> = {
  Website: 'bg-purple-100 text-purple-800',
  Instagram: 'bg-pink-100 text-pink-800',
  Referral: 'bg-indigo-100 text-indigo-800',
};

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ isOpen, onClose, leadId }) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && leadId) {
      const fetchLead = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await getLead(leadId);
          setLead(res.data);
        } catch (err: any) {
          setError('Failed to fetch lead details');
        } finally {
          setIsLoading(false);
        }
      };
      fetchLead();
    } else {
      setLead(null);
    }
  }, [isOpen, leadId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" /> Lead Details
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-gray-500">Loading details...</p>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-6">{error}</div>
          ) : lead ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{lead.name}</h2>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
                  </div>
                </div>
                <div className="text-right">
                  <span className={clsx('px-3 py-1 text-xs font-semibold rounded-full border', statusColors[lead.status])}>
                    {lead.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-gray-100 dark:border-gray-700 py-4">
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5"><Globe className="w-4 h-4"/> Source</p>
                  <span className={clsx('mt-1 inline-block px-2 py-0.5 text-xs font-medium rounded', sourceColors[lead.source])}>
                    {lead.source}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Created</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(lead.createdAt), 'MMM dd, yyyy h:mm a')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-2"><FileText className="w-4 h-4"/> Notes</p>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {lead.notes || <span className="italic text-gray-400">No notes provided.</span>}
                </div>
              </div>

              {lead.assignedTo && (
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-2"><Tag className="w-4 h-4"/> Assigned To</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {lead.assignedTo.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.assignedTo.name}</p>
                      <p className="text-xs text-gray-500">{lead.assignedTo.role}</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
