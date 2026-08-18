import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Mail, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Code, 
  FileText, 
  Eye, 
  Paperclip, 
  KeyRound,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon
} from 'lucide-react';
import { MessageDetail, Attachment } from '../types';
import { formatFullDateTime, formatTimeAgo, formatBytes, extractCodesAndLinks } from '../utils/helpers';

interface MessageViewProps {
  message: MessageDetail | null;
  isLoading: boolean;
  onBack?: () => void;
  onDelete: (id: string) => void;
  accountAddress?: string;
  onRefresh?: () => void;
}

// Generate consistent avatar background color from string
function getAvatarColor(name: string): string {
  const colors = [
    'bg-indigo-600 text-white',
    'bg-blue-600 text-white',
    'bg-emerald-600 text-white',
    'bg-violet-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
    'bg-teal-600 text-white',
    'bg-cyan-600 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
    return <ImageIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
  }
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
    return <FileArchive className="w-4 h-4 text-amber-500 flex-shrink-0" />;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />;
  }
  if (['js', 'ts', 'json', 'html', 'css', 'py'].includes(ext)) {
    return <FileCode className="w-4 h-4 text-indigo-500 flex-shrink-0" />;
  }
  return <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />;
}

export const MessageView: React.FC<MessageViewProps> = ({
  message,
  isLoading,
  onBack,
  onDelete,
  accountAddress,
  onRefresh,
}) => {
  const [viewTab, setViewTab] = useState<'html' | 'text' | 'headers'>('html');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [showMetaDetails, setShowMetaDetails] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (message) {
      const hasHtml = message.html && message.html.length > 0 && message.html.some((h) => h.trim().length > 0);
      if (!hasHtml) {
        setViewTab('text');
      } else {
        setViewTab('html');
      }
      setShowMetaDetails(false);
    }
  }, [message?.id]);

  // Adjust iframe height automatically when content loads
  const handleIframeLoad = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const body = iframeRef.current.contentWindow.document.body;
        const html = iframeRef.current.contentWindow.document.documentElement;
        if (body && html) {
          const height = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            html.clientHeight,
            html.scrollHeight,
            html.offsetHeight
          );
          iframeRef.current.style.height = `${Math.max(height + 30, 380)}px`;
        }
      } catch (e) {
        // Fallback default height
      }
    }
  };

  if (isLoading) {
    return (
      <section className="flex-1 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-12 min-h-[480px] transition-colors">
        <div className="w-8 h-8 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Loading message content...</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Decrypting and parsing incoming email</p>
      </section>
    );
  }

  if (!message) {
    return (
      <section className="flex-1 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-8 lg:p-16 text-center min-h-[480px] transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5 shadow-2xs">
          <Mail className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No message selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">
          Select any incoming email from the left sidebar to view its parsed content, verification codes, and attachments.
        </p>
        {accountAddress && (
          <div className="mt-6 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-400 dark:text-slate-500">Listening to:</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{accountAddress}</span>
          </div>
        )}
      </section>
    );
  }

  const htmlContent = message.html && message.html.length > 0 ? message.html.join('') : '';
  const textContent = message.text || '';
  const extractedCodes = extractCodesAndLinks(textContent || htmlContent, message.subject);

  const senderName = message.from.name || message.from.address.split('@')[0] || 'Unknown Sender';
  const senderEmail = message.from.address || '';
  const senderDomain = senderEmail.includes('@') ? senderEmail.split('@')[1] : '';
  const senderInitial = (senderName.charAt(0) || 'U').toUpperCase();
  const avatarClass = getAvatarColor(senderName);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(textContent || htmlContent);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const handleCopySubject = () => {
    navigator.clipboard.writeText(message.subject || '');
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  return (
    <section className="flex-1 bg-white dark:bg-slate-900 flex flex-col overflow-hidden h-full transition-colors">
      
      {/* Top Action & Navigation Bar */}
      <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-between gap-3 flex-shrink-0 transition-colors">
        
        {/* Left side: Back on mobile + Subject snippet */}
        <div className="flex items-center space-x-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs md:hidden"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Inbox</span>
            </button>
          )}

          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 truncate">
            <span className="flex items-center space-x-1 font-medium text-slate-600 dark:text-slate-300 truncate">
              <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{senderName}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 flex-shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimeAgo(message.createdAt)}</span>
            </span>
          </div>
        </div>

        {/* Right side: Action Toolset (Clean without download & print buttons) */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <button
            id="message-copy-text-btn"
            onClick={handleCopyBody}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-xs font-medium transition-all"
            title="Copy email text content"
          >
            {copiedBody ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedBody ? 'Copied' : 'Copy'}</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />

          <button
            id="message-delete-btn"
            onClick={() => onDelete(message.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete this message"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 space-y-6">
        
        {/* Email Header Card */}
        <div className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 transition-colors">
          
          {/* Subject Line */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-snug tracking-tight">
              {message.subject || '(No Subject)'}
            </h1>
            <button
              onClick={handleCopySubject}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors flex-shrink-0"
              title="Copy subject line"
            >
              {copiedSubject ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Sender & Recipient Information */}
          <div className="flex items-start justify-between gap-4 pt-1">
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0 ${avatarClass}`}>
                {senderInitial}
              </div>
              
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                    {senderName}
                  </span>
                  {senderDomain && (
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      @{senderDomain}
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                  &lt;{senderEmail}&gt;
                </p>
              </div>
            </div>

            {/* Toggle Meta Details Button */}
            <button
              onClick={() => setShowMetaDetails(!showMetaDetails)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors flex-shrink-0 shadow-2xs"
            >
              <span>{showMetaDetails ? 'Hide details' : 'Details'}</span>
              {showMetaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Collapsible Meta Details Drawer */}
          {showMetaDetails && (
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider">From:</span>
                <p className="text-slate-700 dark:text-slate-300 font-mono break-all">{senderName} &lt;{senderEmail}&gt;</p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider">To:</span>
                <p className="text-slate-700 dark:text-slate-300 font-mono break-all">{message.to.map((t) => t.address).join(', ')}</p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider">Date & Time:</span>
                <p className="text-slate-700 dark:text-slate-300">{formatFullDateTime(message.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider">Message Size:</span>
                <p className="text-slate-700 dark:text-slate-300">{formatBytes(message.size || 0)}</p>
              </div>
            </div>
          )}

        </div>

        {/* Extracted Verification Codes & Security Action Card */}
        {extractedCodes.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-indigo-50/90 dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-2xs">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                    Detected Verification & Actions
                  </h4>
                  <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                    Instant 1-click access to codes and links from this email
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                Smart Extract
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              {extractedCodes.map((item, idx) => (
                <div key={idx} className="flex items-center">
                  {item.type === 'otp' ? (
                    <button
                      id={`extract-otp-btn-${idx}`}
                      onClick={() => handleCopyCode(item.code)}
                      className="group inline-flex items-center space-x-2.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-base rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                      title="Click to copy code to clipboard"
                    >
                      <span className="tracking-widest">{item.code}</span>
                      <div className="w-[1px] h-4 bg-indigo-400" />
                      {copiedCode === item.code ? (
                        <span className="text-emerald-200 text-xs font-sans font-medium flex items-center">
                          <Check className="w-3.5 h-3.5 mr-1 text-emerald-300 stroke-[2.5]" /> Copied!
                        </span>
                      ) : (
                        <span className="text-indigo-200 group-hover:text-white text-xs font-sans font-medium flex items-center">
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copy Code
                        </span>
                      )}
                    </button>
                  ) : (
                    <a
                      id={`extract-link-btn-${idx}`}
                      href={item.code}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-indigo-700 dark:text-indigo-300 font-semibold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-2xs transition-all"
                    >
                      <span>Open Confirmation Link</span>
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachments Section */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <Paperclip className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Attachments ({message.attachments.length})</span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Total: {formatBytes(message.attachments.reduce((acc, a) => acc + a.size, 0))}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {message.attachments.map((att: Attachment) => (
                <a
                  key={att.id}
                  href={`https://api.mail.tm${att.downloadUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    {getFileIcon(att.filename)}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {att.filename}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {formatBytes(att.size)} • {att.contentType.split('/')[1] || 'file'}
                      </p>
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 text-slate-400 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-shrink-0">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* View Mode Selector Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center space-x-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {htmlContent && (
              <button
                id="view-tab-html"
                onClick={() => setViewTab('html')}
                className={`flex items-center space-x-1.5 pb-2 transition-colors relative cursor-pointer ${
                  viewTab === 'html' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>HTML Formatted</span>
                {viewTab === 'html' && (
                  <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </button>
            )}
            <button
              id="view-tab-text"
              onClick={() => setViewTab('text')}
              className={`flex items-center space-x-1.5 pb-2 transition-colors relative cursor-pointer ${
                viewTab === 'text' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Plain Text</span>
              {viewTab === 'text' && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
            <button
              id="view-tab-headers"
              onClick={() => setViewTab('headers')}
              className={`flex items-center space-x-1.5 pb-2 transition-colors relative cursor-pointer ${
                viewTab === 'headers' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Technical Data</span>
              {viewTab === 'headers' && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
          </div>

          <button
            onClick={handleCopyBody}
            className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center space-x-1 transition-colors"
          >
            {copiedBody ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedBody ? 'Copied' : 'Copy Content'}</span>
          </button>
        </div>

        {/* Email Body Rendering Box */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl min-h-[360px]">
          {viewTab === 'html' && htmlContent ? (
            <div className="w-full rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-white p-2">
              <iframe
                ref={iframeRef}
                onLoad={handleIframeLoad}
                srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base target="_blank">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      padding: 16px;
      margin: 0;
      line-height: 1.6;
      font-size: 15px;
      word-break: break-word;
      background-color: #ffffff;
    }
    img {
      max-width: 100% !important;
      height: auto !important;
      border-radius: 6px;
    }
    table {
      max-width: 100% !important;
    }
    a {
      color: #4f46e5;
      text-decoration: underline;
      font-weight: 500;
    }
    a:hover {
      color: #3730a3;
    }
    blockquote {
      border-left: 3px solid #cbd5e1;
      margin: 12px 0;
      padding-left: 14px;
      color: #64748b;
    }
    pre, code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      background-color: #f1f5f9;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 13px;
    }
  </style>
</head>
<body>${htmlContent}</body>
</html>`}
                title="Email Body HTML"
                className="w-full min-h-[420px] border-0 bg-white block"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
              />
            </div>
          ) : viewTab === 'text' ? (
            <div className="p-5 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
              {textContent || '(No plain text representation provided in this message)'}
            </div>
          ) : (
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl overflow-hidden border border-slate-800">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                <span>Message Schema & Envelope</span>
                <span>ID: {message.id}</span>
              </div>
              <pre className="text-xs font-mono text-indigo-300 overflow-x-auto p-2">
                {JSON.stringify(
                  {
                    id: message.id,
                    msgid: message.msgid,
                    from: message.from,
                    to: message.to,
                    subject: message.subject,
                    size: message.size,
                    createdAt: message.createdAt,
                    updatedAt: message.updatedAt,
                    hasAttachments: message.hasAttachments,
                    attachmentsCount: message.attachments?.length || 0,
                    downloadUrl: message.downloadUrl,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>

      </div>

      {/* Subtle Footer */}
      <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center space-x-1.5 flex-shrink-0 transition-colors">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>End-to-end sandbox. Inactive temporary mail is automatically purged after 24 hours.</span>
      </div>

    </section>
  );
};
