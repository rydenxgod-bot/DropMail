import React, { useState } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Zap, 
  Trash2, 
  Send, 
  ArrowRight, 
  HelpCircle, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  Inbox,
  AlertTriangle,
  RefreshCw,
  Clock
} from 'lucide-react';

interface HowToUsePageProps {
  onGoToInbox: () => void;
  currentAddress?: string;
}

export const HowToUsePage: React.FC<HowToUsePageProps> = ({ onGoToInbox, currentAddress }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is DropMail and how does it protect my privacy?',
      a: 'DropMail provides instant, anonymous disposable email addresses that receive incoming messages and verification codes without requiring any personal details, passwords, or phone numbers. It keeps your primary personal mailbox clean from newsletters, spam, and data leaks.'
    },
    {
      q: 'How do OTP / Verification Code auto-extractions work?',
      a: 'When an incoming email arrives containing a 4 to 8 digit authentication pin, activation code, or confirmation link, DropMail automatically scans the message text and displays an instant "Copy OTP" pill so you can verify accounts in a single click.'
    },
    {
      q: 'How long are temporary mailboxes and emails retained?',
      a: 'Mailboxes remain active for your current browser session. You can generate custom handles or random addresses anytime. When you are done, simply click "Burn Mailbox" or "Clear History" to delete everything permanently.'
    },
    {
      q: 'Can I receive file attachments?',
      a: 'Yes! DropMail supports receiving standard file attachments including images, PDFs, and documents. Attachments are displayed with one-click direct download and secure MIME type verification.'
    },
    {
      q: 'Can I send emails from this address?',
      a: 'No. DropMail is an inbound-only receiving service designed for account verification, testing, and spam prevention. Preventing outbound sending protects our domains from blacklisting and spam abuse.'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        
        {/* Header Hero Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs text-center relative overflow-hidden transition-colors">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Complete User Guide</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            How to Use DropMail
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Get disposable, anonymous email addresses in seconds. Protect your real inbox from spam, marketers, and data breaches.
          </p>

          {/* Call to action & Telegram row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              id="guide-go-inbox-btn"
              onClick={onGoToInbox}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Inbox className="w-4 h-4" />
              <span>Go to Your Active Inbox</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              id="guide-telegram-join-btn"
              href="https://t.me/RydenXGod"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border border-[#229ED9]/40 text-[#229ED9] dark:text-[#38bdf8] rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Join Telegram Community</span>
            </a>
          </div>
        </div>

        {/* 3 Step Interactive Workflow */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>3 Simple Steps to Anonymous Email</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center">
                  01
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  1. Copy Your Address
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Click the address in the top bar to copy your temporary mailbox. Need a specific handle? Use <strong>New Address</strong> to pick a custom name.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                {currentAddress || 'user.random@mail.tm'}
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-sm flex items-center justify-center">
                  02
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  2. Paste in Any Service
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Use this address for app signups, free trials, WiFi logins, discounts, or web testing without exposing your real identity.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Spam Shielded</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center">
                  03
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  3. Instant OTP & Read
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Incoming mail arrives live every 5 seconds. Verification codes are highlighted with a 1-click copy badge for fast auth.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-1">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Auto Code Detection</span>
              </div>
            </div>

          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Key Advantages & Capabilities</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Zero Registration Required</span>
                <span className="text-slate-500 dark:text-slate-400">No passwords, personal names, phone numbers, or credit cards needed.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start space-x-3">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Real-Time Sync Engine</span>
                <span className="text-slate-500 dark:text-slate-400">Automated 5-second polling keeps your inbox synchronized without manual reloading.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start space-x-3">
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Smart OTP Parser</span>
                <span className="text-slate-500 dark:text-slate-400">Automatically extracts 4-8 digit security pins and confirmation tokens.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start space-x-3">
              <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">One-Click Burn & Delete</span>
                <span className="text-slate-500 dark:text-slate-400">Instantly discard mailboxes and clear local session histories at will.</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Frequently Asked Questions</span>
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-3.5">
                  <button
                    id={`faq-toggle-${idx}`}
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="text-slate-400 font-mono text-base ml-2">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed pr-4 animate-in fade-in duration-150">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Telegram Bot Showcase Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  DropMail Telegram Bot Integration
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Receive disposable emails and OTP verification codes right inside your Telegram chats
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
              Live & Synced
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">🤖 /start & /new</span>
              <span className="text-slate-500 dark:text-slate-400">Instantly generate a disposable mailbox with 1-tap copy and interactive keyboard buttons.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">⚡ Auto Push & OTP</span>
              <span className="text-slate-500 dark:text-slate-400">Incoming emails and detected OTP pins are automatically pushed to your Telegram chat in real time.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">🌐 Web Sync Button</span>
              <span className="text-slate-500 dark:text-slate-400">Click &apos;Open in DropMail Web&apos; from any Telegram message to view full HTML styling and attachments.</span>
            </div>
          </div>
        </div>

        {/* Telegram Community Callout Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-200 dark:border-sky-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-[#229ED9] text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Join our Telegram Official Channel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Get instant updates, request new disposable domains, and connect with @RydenXGod.
              </p>
            </div>
          </div>

          <a
            id="guide-telegram-banner-btn"
            href="https://t.me/RydenXGod"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-[#229ED9] hover:bg-[#1b8bc2] text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-2 transition-transform active:scale-95 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>@RydenXGod</span>
          </a>
        </div>

      </div>
    </div>
  );
};
