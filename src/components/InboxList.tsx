import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Paperclip, 
  KeyRound, 
  Copy, 
  Check, 
  RefreshCw, 
  Inbox 
} from 'lucide-react';
import { MessageSummary } from '../types';
import { formatTimeAgo, extractCodesAndLinks } from '../utils/helpers';

interface InboxListProps {
  messages: MessageSummary[];
  selectedMessageId: string | null;
  onSelectMessage: (id: string) => void;
  onDeleteMessage: (id: string, e: React.MouseEvent) => void;
  onClearAllMessages: () => void;
  isLoading: boolean;
  onRefresh: () => void;
  emailAddress?: string;
}

export const InboxList: React.FC<InboxListProps> = ({
  messages,
  selectedMessageId,
  onSelectMessage,
  onDeleteMessage,
  onClearAllMessages,
  isLoading,
  onRefresh,
  emailAddress,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedOtpId, setCopiedOtpId] = useState<string | null>(null);

  const filteredMessages = useMemo(() => {
    if (!searchTerm.trim()) return messages;
    const term = searchTerm.toLowerCase();
    return messages.filter(
      (m) =>
        m.subject.toLowerCase().includes(term) ||
        m.from.name.toLowerCase().includes(term) ||
        m.from.address.toLowerCase().includes(term) ||
        (m.intro && m.intro.toLowerCase().includes(term))
    );
  }, [messages, searchTerm]);

  const unreadCount = messages.filter((m) => !m.seen).length;

  const handleCopyOtp = (code: string, msgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedOtpId(msgId);
    setTimeout(() => setCopiedOtpId(null), 2000);
  };

  return (
    <aside className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 md:border-r md:border-l-0 md:border-y-0 flex flex-col h-full overflow-hidden shadow-2xs transition-colors">
      
      {/* Header bar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-2">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Inbox
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
            {messages.length}
          </span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {messages.length > 0 && (
            <button
              id="clear-all-messages-btn"
              onClick={onClearAllMessages}
              className="text-xs font-medium text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center space-x-1 transition-colors"
              title="Clear all messages"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Search */}
      <div className="p-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            id="inbox-search-input"
            type="text"
            placeholder="Search inbox..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
          />
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {isLoading && messages.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-2.5">
            <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Checking for incoming mail...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
              <Inbox className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {searchTerm ? 'No matches found' : 'Inbox is empty'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[240px] leading-relaxed">
                {searchTerm
                  ? 'Try a different search keyword.'
                  : 'Emails sent to your temporary address will appear here automatically.'}
              </p>
            </div>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isSelected = selectedMessageId === msg.id;
            const extractedCodes = extractCodesAndLinks(msg.intro, msg.subject);
            const firstOtp = extractedCodes.find((c) => c.type === 'otp');

            return (
              <div
                key={msg.id}
                id={`message-item-${msg.id}`}
                onClick={() => onSelectMessage(msg.id)}
                className={`p-4 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/60 relative group ${
                  isSelected
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-l-4 border-l-indigo-600 dark:border-l-indigo-400'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Sender & Timestamp */}
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate flex items-center">
                    {!msg.seen && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mr-1.5 flex-shrink-0" />
                    )}
                    {msg.from.name || msg.from.address.split('@')[0]}
                  </span>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {msg.hasAttachments && (
                      <Paperclip className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {formatTimeAgo(msg.createdAt)}
                    </span>
                    <button
                      id={`delete-msg-${msg.id}`}
                      onClick={(e) => onDeleteMessage(msg.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-opacity ml-1"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Subject */}
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate mb-1">
                  {msg.subject || '(No subject)'}
                </p>

                {/* Intro Snippet */}
                {msg.intro && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {msg.intro}
                  </p>
                )}

                {/* Inline OTP pill if detected */}
                {firstOtp && (
                  <div className="mt-2 flex items-center">
                    <button
                      id={`quick-copy-otp-${msg.id}`}
                      onClick={(e) => handleCopyOtp(firstOtp.code, msg.id, e)}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-[11px] font-mono font-bold transition-colors"
                      title="Click to copy OTP"
                    >
                      <KeyRound className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                      <span>OTP: {firstOtp.code}</span>
                      {copiedOtpId === msg.id ? (
                        <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 ml-0.5" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 ml-0.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Auto-delete disclaimer footer */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium transition-colors">
        All messages are temporary and disposable.
      </div>

    </aside>
  );
};
