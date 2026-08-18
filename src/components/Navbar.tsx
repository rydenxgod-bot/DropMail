import React, { useState } from 'react';
import { 
  Mail, 
  Copy, 
  Check, 
  RefreshCw, 
  Plus, 
  History, 
  Sun,
  Moon, 
  QrCode, 
  Trash2,
  Send,
  BookOpen,
  ShieldCheck,
  Inbox
} from 'lucide-react';
import { AccountCredentials } from '../types';

export type ActiveTabType = 'inbox' | 'guide' | 'policies';

interface NavbarProps {
  account: AccountCredentials | null;
  isLoadingAccount: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenNewMailModal: () => void;
  onOpenHistory: () => void;
  onOpenQrModal: () => void;
  onDeleteAccount: () => void;
  historyCount: number;
  cooldownRemaining: number;
  autoRefreshCountdown: number;
  isAutoRefreshActive: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  activeTab: ActiveTabType;
  onChangeTab: (tab: ActiveTabType) => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  account,
  isLoadingAccount,
  isRefreshing,
  onRefresh,
  onOpenNewMailModal,
  onOpenHistory,
  onOpenQrModal,
  onDeleteAccount,
  historyCount,
  cooldownRemaining,
  autoRefreshCountdown,
  isAutoRefreshActive,
  theme,
  onToggleTheme,
  activeTab,
  onChangeTab,
  unreadCount = 0,
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
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs sticky top-0 z-30 transition-colors">
      
      {/* Top Main Navbar Row */}
      <div className="flex items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        
        {/* Brand Logo & 3 Main Tabs */}
        <div className="flex items-center space-x-3 sm:space-x-6 flex-shrink-0">
          <div 
            onClick={() => onChangeTab('inbox')}
            className="flex items-center space-x-2.5 cursor-pointer select-none group"
            title="DropMail Home"
          >
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">DropMail</span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
          </div>

          {/* 3 Main Desktop Tab Buttons */}
          <nav className="hidden lg:flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-x-1 text-xs font-semibold">
            <button
              id="nav-tab-inbox-btn"
              onClick={() => onChangeTab('inbox')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'inbox'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Inbox</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-guide-btn"
              onClick={() => onChangeTab('guide')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>How to Use</span>
            </button>

            <button
              id="nav-tab-policies-btn"
              onClick={() => onChangeTab('policies')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'policies'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Policies & Terms</span>
            </button>
          </nav>
        </div>

        {/* Center Address Pill Container (Desktop) */}
        <div className="hidden md:flex items-center space-x-3 flex-1 justify-center max-w-md lg:max-w-lg mx-3">
          <div 
            onClick={handleCopy}
            className="flex items-center bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-150 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-full px-3.5 py-1.5 w-full cursor-pointer transition-colors group shadow-2xs"
            title="Click to copy address"
          >
            <span className="text-slate-400 dark:text-slate-500 mr-2 text-[11px] uppercase font-bold tracking-wider flex-shrink-0">
              Address:
            </span>
            <span id="current-address" className="text-slate-800 dark:text-slate-200 font-mono text-xs sm:text-sm truncate select-all flex-1">
              {isLoadingAccount ? 'Generating address...' : account?.address || 'No active address'}
            </span>
            <button
              id="navbar-copy-address-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="ml-auto p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors flex-shrink-0"
              title="Copy address"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
          
          {/* Refresh Button */}
          <button
            id="navbar-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing || !account}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors border border-transparent text-xs disabled:opacity-50 cursor-pointer"
            title="Refresh Inbox"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
            <span className="hidden xl:inline">Refresh</span>
          </button>

          {/* Generate New Address Button */}
          <button
            id="navbar-generate-btn"
            onClick={onOpenNewMailModal}
            disabled={cooldownRemaining > 0 || isLoadingAccount}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-all shadow-xs text-xs ${
              cooldownRemaining > 0
                ? 'bg-indigo-400 text-white cursor-not-allowed opacity-75'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99] cursor-pointer'
            }`}
            title={cooldownRemaining > 0 ? `Wait cooldown (${cooldownRemaining}s)` : 'Generate a new disposable address'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Address</span>
            <span className="sm:hidden">New</span>
            {cooldownRemaining > 0 && (
              <span id="navbar-timer-badge" className="bg-indigo-900/60 text-[10px] px-1 py-0.2 rounded font-mono font-bold ml-0.5">
                {cooldownRemaining}s
              </span>
            )}
          </button>

          {/* Auxiliary tools */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 pl-1 border-l border-slate-200 dark:border-slate-800">
            <button
              id="navbar-qr-btn"
              onClick={onOpenQrModal}
              disabled={!account}
              className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Scan QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>

            {/* Theme Switcher Button */}
            <button
              id="navbar-theme-btn"
              onClick={onToggleTheme}
              className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
              aria-label={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 hover:text-slate-900 transition-colors" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile/Tablet Sub-Tab Bar */}
      <div className="flex lg:hidden items-center justify-around px-2 py-1.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          id="mobile-tab-inbox-btn"
          onClick={() => onChangeTab('inbox')}
          className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg transition-colors ${
            activeTab === 'inbox'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Inbox</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          id="mobile-tab-guide-btn"
          onClick={() => onChangeTab('guide')}
          className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg transition-colors ${
            activeTab === 'guide'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>How to Use</span>
        </button>

        <button
          id="mobile-tab-policies-btn"
          onClick={() => onChangeTab('policies')}
          className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg transition-colors ${
            activeTab === 'policies'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Policies & Terms</span>
        </button>
      </div>

    </header>
  );
};
