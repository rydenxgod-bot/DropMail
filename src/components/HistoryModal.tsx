import React from 'react';
import { X, History, Mail, ArrowRight, Trash2, Check } from 'lucide-react';
import { AccountCredentials } from '../types';
import { formatTimeAgo } from '../utils/helpers';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AccountCredentials[];
  currentAccountId?: string;
  onSwitchAccount: (account: AccountCredentials) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  currentAccountId,
  onSwitchAccount,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh] transition-colors">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Session Email History</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Previously generated addresses in this browser session</p>
            </div>
          </div>
          <button
            id="close-history-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          {history.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No previous addresses recorded in this session yet.
            </div>
          ) : (
            history.map((item) => {
              const isCurrent = item.id === currentAccountId;
              return (
                <div
                  key={item.id}
                  id={`history-item-${item.id}`}
                  className={`pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-3 rounded-xl transition-colors ${
                    isCurrent ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      <span className="font-mono text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.address}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 pl-6">
                      Created {formatTimeAgo(item.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isCurrent ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                        <Check className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        id={`switch-account-${item.id}`}
                        onClick={() => {
                          onSwitchAccount(item);
                          onClose();
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors"
                      >
                        <span>Switch</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/90 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total stored: {history.length}</span>
            <button
              id="clear-session-history-btn"
              onClick={onClearHistory}
              className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center space-x-1 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
