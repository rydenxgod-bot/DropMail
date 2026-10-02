import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  fetchDomains, 
  createAccount, 
  fetchMessages, 
  fetchMessageDetail, 
  deleteMessage, 
  markMessageAsSeen, 
  deleteAccount
} from './services/mailApi';
import { Domain, AccountCredentials, MessageSummary, MessageDetail } from './types';
import { playChimeSound } from './utils/helpers';
import { Navbar, ActiveTabType } from './components/Navbar';
import { EmailHeaderCard } from './components/EmailHeaderCard';
import { InboxList } from './components/InboxList';
import { MessageView } from './components/MessageView';
import { HowToUsePage } from './components/HowToUsePage';
import { PoliciesPage } from './components/PoliciesPage';
import { NewEmailModal } from './components/NewEmailModal';
import { HistoryModal } from './components/HistoryModal';
import { QRCodeModal } from './components/QRCodeModal';
import { NewMessageToast } from './components/NewMessageToast';
import { AlertCircle, RefreshCw } from 'lucide-react';

const STORAGE_ACCOUNT_KEY = 'dropmail_active_account';
const STORAGE_HISTORY_KEY = 'dropmail_session_history';
const STORAGE_THEME_KEY = 'dropmail_theme';
const REFRESH_INTERVAL_SEC = 5;
const COOLDOWN_INTERVAL_SEC = 5;

export default function App() {
  // Navigation & Page State
  const [activeTab, setActiveTab] = useState<ActiveTabType>('inbox');

  // Theme State (default: 'light')
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Accounts & Domains State
  const [account, setAccount] = useState<AccountCredentials | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [history, setHistory] = useState<AccountCredentials[]>([]);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Messages State
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedMessageDetail, setSelectedMessageDetail] = useState<MessageDetail | null>(null);
  const [isLoadingMessageDetail, setIsLoadingMessageDetail] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newIncomingMessage, setNewIncomingMessage] = useState<MessageSummary | null>(null);

  // Timers and Settings
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(REFRESH_INTERVAL_SEC);
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState(true);

  // Modals
  const [isNewMailModalOpen, setIsNewMailModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Track previous message IDs to detect new incoming items
  const knownMessageIdsRef = useRef<Set<string>>(new Set());

  // 1. Initial Load: Load Theme, History, and Account
  useEffect(() => {
    const savedTheme = (localStorage.getItem(STORAGE_THEME_KEY) as 'light' | 'dark' | null) || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    try {
      const savedHistory = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error('Failed to parse saved history');
    }

    initializeSession();
  }, []);

  const handleToggleTheme = () => {
    const nextTheme: 'light' | 'dark' = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem(STORAGE_THEME_KEY, nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Cooldown countdown runner
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  const triggerCooldown = () => {
    setCooldownRemaining(COOLDOWN_INTERVAL_SEC);
  };

  const initializeSession = async () => {
    setIsLoadingAccount(true);
    setErrorMessage(null);
    try {
      const activeDomains = await fetchDomains().catch(() => []);
      if (activeDomains.length > 0) {
        setDomains(activeDomains);
      }

      const savedAccountStr = localStorage.getItem(STORAGE_ACCOUNT_KEY);
      if (savedAccountStr) {
        try {
          const savedAccount: AccountCredentials = JSON.parse(savedAccountStr);
          const res = await fetchMessages(savedAccount.token, 1);
          setAccount(savedAccount);
          setMessages(res.messages);
          knownMessageIdsRef.current = new Set(res.messages.map((m) => m.id));
          setIsLoadingAccount(false);
          return;
        } catch (tokenErr) {
          console.warn('Persisted account token invalid, creating fresh one:', tokenErr);
          localStorage.removeItem(STORAGE_ACCOUNT_KEY);
        }
      }

      await handleGenerateNewAccount();
    } catch (err: any) {
      console.error('Initialization fallback attempt:', err);
      try {
        await handleGenerateNewAccount();
      } catch (fallbackErr: any) {
        setErrorMessage(fallbackErr.message || 'Connecting to mail server...');
        setIsLoadingAccount(false);
      }
    }
  };

  const handleGenerateNewAccount = async () => {
    setIsLoadingAccount(true);
    setErrorMessage(null);
    setSelectedMessageId(null);
    setSelectedMessageDetail(null);
    setMessages([]);
    knownMessageIdsRef.current.clear();

    try {
      const newAcc = await createAccount();
      setAccount(newAcc);
      localStorage.setItem(STORAGE_ACCOUNT_KEY, JSON.stringify(newAcc));

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.address !== newAcc.address);
        const updated = [newAcc, ...filtered].slice(0, 15);
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updated));
        return updated;
      });

      triggerCooldown();
      setIsLoadingAccount(false);
      setAutoRefreshCountdown(REFRESH_INTERVAL_SEC);
      setErrorMessage(null);
    } catch (err: any) {
      console.warn('Account generation warning:', err.message);
      setErrorMessage(err.message || 'Could not generate email address');
      setIsLoadingAccount(false);
    }
  };

  const handleSwitchAccount = async (acc: AccountCredentials) => {
    setAccount(acc);
    localStorage.setItem(STORAGE_ACCOUNT_KEY, JSON.stringify(acc));
    setSelectedMessageId(null);
    setSelectedMessageDetail(null);
    setMessages([]);
    knownMessageIdsRef.current.clear();
    setIsHistoryModalOpen(false);
    setIsLoadingAccount(true);

    try {
      const res = await fetchMessages(acc.token, 1);
      setMessages(res.messages);
      knownMessageIdsRef.current = new Set(res.messages.map((m) => m.id));
      triggerCooldown();
    } catch (e: any) {
      console.error('Failed to load switched account messages:', e);
    } finally {
      setIsLoadingAccount(false);
    }
  };

  const handleDeleteCurrentAccount = async () => {
    if (!account) return;
    const confirmDelete = window.confirm(
      `Burn and destroy mailbox ${account.address}? All messages will be permanently lost.`
    );
    if (!confirmDelete) return;

    try {
      await deleteAccount(account.token, account.id).catch(() => {});
    } finally {
      setHistory((prev) => {
        const filtered = prev.filter((h) => h.id !== account.id);
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(filtered));
        return filtered;
      });
      localStorage.removeItem(STORAGE_ACCOUNT_KEY);
      handleGenerateNewAccount();
    }
  };

  const checkMessages = useCallback(async (isAuto = false) => {
    if (!account?.token) return;
    if (!isAuto) {
      setIsRefreshing(true);
    }

    try {
      const res = await fetchMessages(account.token, 1);
      const incomingList = res.messages;

      // Detect any new messages that weren't in known set
      const newItems = incomingList.filter((m) => !knownMessageIdsRef.current.has(m.id));
      if (newItems.length > 0) {
        newItems.forEach((item) => knownMessageIdsRef.current.add(item.id));
        const latestNew = newItems[0];
        setNewIncomingMessage(latestNew);
        playChimeSound();
      }

      setMessages(incomingList);
    } catch (e: any) {
      console.warn('Inbox sync note:', e.message);
    } finally {
      if (!isAuto) {
        setIsRefreshing(false);
      }
    }
  }, [account?.token, selectedMessageId]);

  // Polling loop for real-time live inbox updates
  useEffect(() => {
    if (!account?.token || !isAutoRefreshActive) return;

    const interval = setInterval(() => {
      setAutoRefreshCountdown((prev) => {
        if (prev <= 1) {
          checkMessages(true);
          return REFRESH_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [account?.token, isAutoRefreshActive, checkMessages]);

  const handleSelectMessage = async (id: string, tokenOverride?: string) => {
    const token = tokenOverride || account?.token;
    if (!token) return;

    setSelectedMessageId(id);
    setIsLoadingMessageDetail(true);

    try {
      const detail = await fetchMessageDetail(token, id);
      setSelectedMessageDetail(detail);

      // Mark as seen locally and remotely
      markMessageAsSeen(token, id).catch(() => {});
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, seen: true } : m))
      );
    } catch (err: any) {
      console.error('Error fetching message details:', err);
    } finally {
      setIsLoadingMessageDetail(false);
    }
  };

  const handleDeleteMessage = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!account?.token) return;

    try {
      await deleteMessage(account.token, id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      knownMessageIdsRef.current.delete(id);

      if (selectedMessageId === id) {
        setSelectedMessageId(null);
        setSelectedMessageDetail(null);
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleClearAllMessages = async () => {
    if (!account?.token || messages.length === 0) return;
    const confirmClear = window.confirm('Delete all messages in this inbox?');
    if (!confirmClear) return;

    const token = account.token;
    for (const msg of messages) {
      deleteMessage(token, msg.id).catch(() => {});
    }

    setMessages([]);
    setSelectedMessageId(null);
    setSelectedMessageDetail(null);
  };

  const handleClearHistory = () => {
    const confirmClear = window.confirm('Clear all saved email history?');
    if (confirmClear) {
      setHistory([]);
      localStorage.removeItem(STORAGE_HISTORY_KEY);
      setIsHistoryModalOpen(false);
    }
  };

  const unreadCount = messages.filter((m) => !m.seen).length;

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fafc] dark:bg-slate-950 font-sans overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Top Header Navbar with 3 Tabs & Telegram Button */}
      <Navbar
        account={account}
        isLoadingAccount={isLoadingAccount}
        isRefreshing={isRefreshing}
        onRefresh={() => checkMessages(false)}
        onOpenNewMailModal={() => setIsNewMailModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onDeleteAccount={handleDeleteCurrentAccount}
        historyCount={history.length}
        cooldownRemaining={cooldownRemaining}
        autoRefreshCountdown={autoRefreshCountdown}
        isAutoRefreshActive={isAutoRefreshActive}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        unreadCount={unreadCount}
      />

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            id="retry-generate-account-btn"
            onClick={() => handleGenerateNewAccount().catch(() => {})}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium text-xs flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Page Views based on activeTab */}
      {activeTab === 'guide' && (
        <HowToUsePage 
          onGoToInbox={() => setActiveTab('inbox')} 
          currentAddress={account?.address}
        />
      )}

      {activeTab === 'policies' && (
        <PoliciesPage 
          onGoToInbox={() => setActiveTab('inbox')} 
        />
      )}

      {activeTab === 'inbox' && (
        <>
          {/* Mobile-only Address Card */}
          <div className="px-4 pt-3 md:hidden">
            <EmailHeaderCard
              account={account}
              isLoadingAccount={isLoadingAccount}
              isRefreshing={isRefreshing}
              onRefresh={() => checkMessages(false)}
              onOpenNewMailModal={() => setIsNewMailModalOpen(true)}
              onOpenQrModal={() => setIsQrModalOpen(true)}
              onDeleteAccount={handleDeleteCurrentAccount}
              cooldownRemaining={cooldownRemaining}
              autoRefreshCountdown={autoRefreshCountdown}
              isAutoRefreshActive={isAutoRefreshActive}
            />
          </div>

          {/* Main Split Layout */}
          <main className="flex flex-1 overflow-hidden">
            {/* Left Column: Inbox List */}
            <div className="w-full md:w-80 lg:w-96 flex-shrink-0 h-full flex flex-col">
              <InboxList
                messages={messages}
                selectedMessageId={selectedMessageId}
                onSelectMessage={(id) => handleSelectMessage(id)}
                onDeleteMessage={handleDeleteMessage}
                onClearAllMessages={handleClearAllMessages}
                isLoading={isLoadingAccount || isRefreshing}
                onRefresh={() => checkMessages(false)}
                emailAddress={account?.address}
              />
            </div>

            {/* Right Column: Message Detail / Empty State */}
            <div className="hidden md:flex flex-1 h-full bg-white dark:bg-slate-900 flex-col overflow-hidden transition-colors">
              <MessageView
                message={selectedMessageDetail}
                isLoading={isLoadingMessageDetail}
                onDelete={() => selectedMessageId && handleDeleteMessage(selectedMessageId)}
                accountAddress={account?.address}
                onRefresh={() => checkMessages(false)}
              />
            </div>
          </main>
        </>
      )}

      {/* Mobile Drawer/Modal for message details when a message is selected */}
      {activeTab === 'inbox' && selectedMessageId && (
        <div className="fixed inset-0 z-40 bg-white dark:bg-slate-900 md:hidden flex flex-col">
          <div className="flex-1 overflow-hidden">
            <MessageView
              message={selectedMessageDetail}
              isLoading={isLoadingMessageDetail}
              onBack={() => setSelectedMessageId(null)}
              onDelete={() => handleDeleteMessage(selectedMessageId)}
              accountAddress={account?.address}
              onRefresh={() => checkMessages(false)}
            />
          </div>
        </div>
      )}

      {/* New Email Modal */}
      <NewEmailModal
        isOpen={isNewMailModalOpen}
        onClose={() => setIsNewMailModalOpen(false)}
        onGenerate={handleGenerateNewAccount}
        cooldownRemaining={cooldownRemaining}
      />

      {/* Session History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        currentAccountId={account?.id}
        onSwitchAccount={handleSwitchAccount}
        onClearHistory={handleClearHistory}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        address={account?.address || ''}
      />

      {/* New Message Received Toast */}
      {newIncomingMessage && (
        <NewMessageToast
          message={newIncomingMessage}
          onDismiss={() => setNewIncomingMessage(null)}
          onView={(id) => {
            setActiveTab('inbox');
            handleSelectMessage(id);
            setNewIncomingMessage(null);
          }}
        />
      )}

    </div>
  );
}
