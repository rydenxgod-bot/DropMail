import React, { useState } from 'react';
import { X, QrCode, Copy, Check, Smartphone } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, address }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(address)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full overflow-hidden text-center transition-colors">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90">
          <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-100 font-bold text-sm">
            <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Mobile Scan QR Code</span>
          </div>
          <button
            id="close-qr-modal-btn"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          <div className="p-3 bg-white border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm mb-4">
            <img
              src={qrUrl}
              alt={`QR code for ${address}`}
              className="w-48 h-48 rounded-lg"
              loading="lazy"
            />
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Scan with your phone camera to copy address</span>
          </div>

          <div className="w-full mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
            {address}
          </div>

          <button
            id="copy-qr-address-btn"
            onClick={handleCopy}
            className="mt-4 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Address'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
