import React, { useState, useEffect } from 'react';
import { X, Sparkles, Wand2, AtSign, AlertCircle, Loader2 } from 'lucide-react';
import { Domain } from '../types';
import { generateRandomUsername } from '../services/mailApi';

interface NewEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  domains: Domain[];
  onGenerate: (customUsername?: string, domain?: string) => Promise<void>;
  cooldownRemaining: number;
}

export const NewEmailModal: React.FC<NewEmailModalProps> = ({
  isOpen,
  onClose,
  domains,
  onGenerate,
  cooldownRemaining,
}) => {
  const [mode, setMode] = useState<'random' | 'custom'>('random');
  const [customUser, setCustomUser] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (domains.length > 0 && !selectedDomain) {
      setSelectedDomain(domains[0].domain);
    }
  }, [domains, selectedDomain]);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setCustomUser(generateRandomUsername());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRandomSubmit = async () => {
    if (cooldownRemaining > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onGenerate();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create email account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownRemaining > 0 || isSubmitting) return;
    const cleanUser = customUser.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    if (!cleanUser) {
      setErrorMsg('Please enter a valid username (letters, numbers, dots, hyphens)');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onGenerate(cleanUser, selectedDomain || (domains[0] && domains[0].domain));
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Username might be taken or domain unavailable');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden transition-colors">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Generate New Disposable Email</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Create a clean temporary mailbox instantly</p>
            </div>
          </div>
          <button
            id="close-new-email-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cooldown Warning Notice if active */}
        {cooldownRemaining > 0 && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 flex items-center space-x-2 text-xs text-amber-900 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>
              Creation cooldown active: Please wait <strong>{cooldownRemaining}s</strong> before generating another address.
            </span>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 flex items-start space-x-2 text-xs text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 space-y-4">
          
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              id="mode-random-btn"
              type="button"
              onClick={() => setMode('random')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                mode === 'random' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Random Generated</span>
            </button>
            <button
              id="mode-custom-btn"
              type="button"
              onClick={() => setMode('custom')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                mode === 'custom' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <AtSign className="w-3.5 h-3.5" />
              <span>Custom Handle</span>
            </button>
          </div>

          {mode === 'random' ? (
            <div className="space-y-4 pt-1">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-800 dark:text-slate-100">Instant One-Click Address:</p>
                <p>Generates an anonymized, unique temporary inbox on the most reliable active domain.</p>
              </div>

              <button
                id="submit-random-email-btn"
                type="button"
                onClick={handleRandomSubmit}
                disabled={cooldownRemaining > 0 || isSubmitting}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Allocating address...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Create Random Address</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Desired Username
                </label>
                <input
                  id="custom-username-input"
                  type="text"
                  value={customUser}
                  onChange={(e) => setCustomUser(e.target.value)}
                  placeholder="e.g. testing.alex"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-750 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Domain Extension
                </label>
                <select
                  id="custom-domain-select"
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-750 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                >
                  {domains.map((d) => (
                    <option key={d.id} value={d.domain}>
                      @{d.domain} {d.provider ? `(${d.provider})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 font-mono">
                Preview: {customUser ? customUser.trim().toLowerCase() : 'user'}@{selectedDomain || 'mail.tm'}
              </div>

              <button
                id="submit-custom-email-btn"
                type="submit"
                disabled={cooldownRemaining > 0 || isSubmitting || !customUser.trim()}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering address...</span>
                  </>
                ) : (
                  <>
                    <AtSign className="w-4 h-4" />
                    <span>Create Custom Mailbox</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
