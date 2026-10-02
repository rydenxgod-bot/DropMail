import React, { useState } from 'react';
import { X, Sparkles, Wand2, AlertCircle, Loader2 } from 'lucide-react';

interface NewEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => Promise<void>;
  cooldownRemaining: number;
}

export const NewEmailModal: React.FC<NewEmailModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  cooldownRemaining,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGenerateClick = async () => {
    if (cooldownRemaining > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onGenerate();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create email account. Retrying...');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full overflow-hidden transition-colors">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Generate New Email</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Instant random address allocation</p>
            </div>
          </div>
          <button
            id="close-new-email-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cooldown Notice */}
        {cooldownRemaining > 0 && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 flex items-center space-x-2 text-xs text-amber-900 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>
              Wait <strong>{cooldownRemaining}s</strong> before generating another address.
            </span>
          </div>
        )}

        {/* Error Notice */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 flex items-start space-x-2 text-xs text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-800 dark:text-slate-100">Best Available Domain Allocation:</p>
            <p>Automatically selects the fastest, most reliable active domain without manual configuration.</p>
          </div>

          <button
            id="submit-random-email-btn"
            type="button"
            onClick={handleGenerateClick}
            disabled={cooldownRemaining > 0 || isSubmitting}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Address...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Generate Random Mailbox</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
