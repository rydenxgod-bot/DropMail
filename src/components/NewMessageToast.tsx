import React from 'react';
import { Mail, X, ArrowRight, KeyRound } from 'lucide-react';
import { MessageSummary } from '../types';
import { extractCodesAndLinks } from '../utils/helpers';

interface NewMessageToastProps {
  message: MessageSummary | null;
  onView: (id: string) => void;
  onDismiss: () => void;
}

export const NewMessageToast: React.FC<NewMessageToastProps> = ({
  message,
  onView,
  onDismiss,
}) => {
  if (!message) return null;

  const codes = extractCodesAndLinks(message.intro, message.subject);
  const otp = codes.find(c => c.type === 'otp');

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 dark:border-slate-700 flex items-start space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
          <Mail className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              New Message Received
            </span>
            <button
              id="dismiss-toast-btn"
              onClick={onDismiss}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
            {message.from.name || message.from.address}
          </p>

          <p className="text-sm font-bold text-white truncate mt-0.5">
            {message.subject || '(No subject)'}
          </p>

          {otp && (
            <div className="mt-2 inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-xs font-mono font-bold border border-amber-400/30">
              <KeyRound className="w-3 h-3 text-amber-400" />
              <span>OTP: {otp.code}</span>
            </div>
          )}

          <div className="mt-3 flex items-center space-x-2">
            <button
              id="view-toast-message-btn"
              onClick={() => {
                onView(message.id);
                onDismiss();
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
            >
              <span>View Message</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              id="close-toast-message-btn"
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
