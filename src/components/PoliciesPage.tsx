import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Info, 
  Send, 
  CheckCircle, 
  ExternalLink, 
  Lock, 
  Trash2, 
  Server, 
  UserCheck,
  Inbox,
  ArrowRight
} from 'lucide-react';

interface PoliciesPageProps {
  onGoToInbox: () => void;
}

export const PoliciesPage: React.FC<PoliciesPageProps> = ({ onGoToInbox }) => {
  const [activeSection, setActiveSection] = useState<'privacy' | 'terms' | 'about'>('privacy');

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        
        {/* Header Title */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Legal, Privacy & About</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Policies & Terms of Service
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Clear, transparent privacy guarantees and acceptable usage policies for DropMail.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <button
              id="policies-back-inbox-btn"
              onClick={onGoToInbox}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Back to Inbox</span>
            </button>
            <a
              id="policies-telegram-link"
              href="https://t.me/RydenXGod"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#229ED9] hover:bg-[#1b8bc2] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </a>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="grid grid-cols-3 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            id="tab-privacy-policy-btn"
            onClick={() => setActiveSection('privacy')}
            className={`py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeSection === 'privacy'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>
          <button
            id="tab-terms-service-btn"
            onClick={() => setActiveSection('terms')}
            className={`py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeSection === 'terms'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
          </button>
          <button
            id="tab-about-dropmail-btn"
            onClick={() => setActiveSection('about')}
            className={`py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeSection === 'about'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>About & Community</span>
          </button>
        </div>

        {/* Content Section: Privacy Policy */}
        {activeSection === 'privacy' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Privacy & Data Protection Policy</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Last updated: August 2026. Effective immediately.
              </p>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-sm">
                  1. Zero Personally Identifiable Information (PII) Collection
                </h3>
                <p>
                  DropMail does not require, collect, or store any personal data, including your real name, physical address, phone number, payment details, or personal emails. No registration is ever required to create an inbox.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-sm">
                  2. Ephemeral Storage & Automatic Disposal
                </h3>
                <p>
                  Incoming emails and verification tokens are stored temporarily on secure ephemeral mail nodes. Users have immediate 1-click access to delete individual emails, clear session histories, or completely burn the current address.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-sm">
                  3. Browser Local Storage
                </h3>
                <p>
                  We store only active mailbox session identifiers and your dark/light theme preference inside your browser’s local storage (`localStorage`). This data never leaves your device and can be cleared instantly in the history menu.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-sm">
                  4. Third-Party Tracking & Advertising
                </h3>
                <p>
                  DropMail operates ad-free and tracker-free. We do not sell, rent, or distribute any email contents or metadata to third parties, data brokers, or advertisers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Section: Terms of Service */}
        {activeSection === 'terms' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Terms of Service & Acceptable Use</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                By utilizing DropMail, you agree to comply with these terms.
              </p>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-sm">
                  1. Permitted Uses
                </h3>
                <p>
                  DropMail is provided for legitimate privacy protection, development testing, spam mitigation, software QA testing, and anonymous verification on non-critical web services.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-sm">
                  2. Prohibited & Illegal Activities
                </h3>
                <p>
                  You may not use DropMail for any illegal purpose, fraud, financial scams, phishing, spamming, denial of service attacks, harassment, or unauthorized access to systems. Any abusive activity will result in immediate blocking.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-sm">
                  3. Important Notice Regarding Critical Accounts
                </h3>
                <p>
                  Because DropMail provides disposable, temporary addresses, you should <strong>NEVER</strong> use these addresses for critical accounts such as banking, government portals, primary crypto wallets, or long-term accounts requiring password recovery in the future.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-sm">
                  4. Disclaimer of Warranties
                </h3>
                <p>
                  DropMail is provided "as is" and "as available" without warranty of any kind. Service availability depends on underlying mail routing and domain propagation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Section: About & Community */}
        {activeSection === 'about' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>About DropMail</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Built with precision for fast, anonymous email disposable routing.
              </p>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                DropMail is a modern, high-speed temporary email utility engineered for privacy advocates, developers, QA testers, and everyday users who value their digital sovereignty and hate inbox clutter.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-100 block text-xs">🚀 High-Speed Engine</span>
                  <span className="text-slate-500 dark:text-slate-400">Powered by resilient Mail.tm and Mail.gw decentralized MX relays for sub-second mail reception.</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-100 block text-xs">🛡️ Built-in OTP Intelligence</span>
                  <span className="text-slate-500 dark:text-slate-400">Regex-driven smart extraction of one-time passwords, pins, and auth tokens.</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-100 block text-xs">🌓 Clean Adaptive UI</span>
                  <span className="text-slate-500 dark:text-slate-400">Light and dark theme modes with full responsive desktop and mobile support.</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-100 block text-xs">📱 Cross-Device QR</span>
                  <span className="text-slate-500 dark:text-slate-400">Instant QR code generation to transfer addresses to your mobile device effortlessly.</span>
                </div>
              </div>
            </div>

            {/* Telegram Community Connect Card */}
            <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-[#229ED9]/15 via-indigo-500/10 to-purple-500/10 border border-[#229ED9]/30 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Send className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Official Telegram Channel
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md">
                    Join our Telegram channel for direct domain updates, release announcements, and direct creator chat with <strong>@RydenXGod</strong>.
                  </p>
                </div>
              </div>

              <a
                id="about-telegram-join-btn"
                href="https://t.me/RydenXGod"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#229ED9] hover:bg-[#1b8bc2] text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition-transform active:scale-95 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Join https://t.me/RydenXGod</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
