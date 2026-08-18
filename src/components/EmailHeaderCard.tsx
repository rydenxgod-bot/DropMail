import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  RefreshCw, 
  Plus, 
  Clock, 
  Mail 
} from 'lucide-react';
import { AccountCredentials } from '../types';

interface EmailHeaderCardProps {
  account: AccountCredentials | null;
  isLoadingAccount: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenNewMailModal: () => void;
  onOpenQrModal: () => void;
  onDeleteAccount: () => void;
  cooldownRemaining: number;
  autoRefreshCountdown: number;
  isAutoRefreshActive: boolean;
}

export const EmailHeaderCard: React.FC<EmailHeaderCardProps> = ({
  account,
  isLoadingAccount,
  isRefreshing,
  onRefresh,
  onOpenNewMailModal,
  cooldownRemaining,
  autoRefreshCountdown,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!account?.address) return;
    try {
      await navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = account.address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 mb-5 md:hidden transition-colors">
      <div className="flex flex-col gap-3.5">
        
        {/* Header Title */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center">
            <Mail className="w-3.5 h-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
            Temporary Address
          </span>
          <div className="flex items-center space-x-1.5 text-slate-400 dark:text-slate-500 text-[11px]">
            <Clock className="w-3 h-3" />
            <span>Sync in {autoRefreshCountdown}s</span>
          </div>
        </div>

        {/* Address Pill Container */}
        <div 
          onClick={handleCopy}
          className="flex items-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-150 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2.5 cursor-pointer transition-colors"
        >
          <span className="text-slate-800 dark:text-slate-200 font-mono text-xs sm:text-sm font-medium truncate flex-1 select-all">
            {isLoadingAccount ? 'Generating address...' : account?.address || 'No active address'}
          </span>
          <button
            id="mobile-copy-address-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="ml-2 p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex-shrink-0"
            title="Copy address"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center gap-2 pt-1">
          <button
            id="mobile-copy-btn"
            onClick={handleCopy}
            disabled={!account || isLoadingAccount}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            id="mobile-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing || !account}
            className="py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            id="mobile-new-addr-btn"
            onClick={onOpenNewMailModal}
            disabled={cooldownRemaining > 0 || isLoadingAccount}
            className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'New'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
