import { ExtractedCode } from '../types';

export function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 5) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatFullDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function extractCodesAndLinks(text?: string, subject?: string): ExtractedCode[] {
  const results: ExtractedCode[] = [];
  const combined = `${subject || ''} \n ${text || ''}`;
  if (!combined.trim()) return results;

  // 1. Look for explicit verification/OTP code patterns (e.g. "code is 123456", "verification code: 9876", "OTP: 458921")
  const otpKeywords = /(?:verification|verify|code|otp|pin|passcode|token|confirmation)[\s:=-]+([0-9]{4,8})/gi;
  let match: RegExpExecArray | null;
  while ((match = otpKeywords.exec(combined)) !== null) {
    const code = match[1];
    if (!results.some(r => r.code === code)) {
      results.push({
        code,
        type: 'otp',
        label: 'Verification Code',
      });
    }
  }

  // 2. Standalone 6-digit or 4-digit strong numerical code match if not found yet
  if (results.length === 0) {
    const digitMatch = combined.match(/\b([0-9]{6})\b/);
    if (digitMatch && !results.some(r => r.code === digitMatch[1])) {
      results.push({
        code: digitMatch[1],
        type: 'otp',
        label: 'Detected 6-digit Code',
      });
    }
  }

  // 3. Look for verification URLs
  const urlRegex = /(https?:\/\/[^\s<>"']+verify[^\s<>"']*|https?:\/\/[^\s<>"']+confirm[^\s<>"']*|https?:\/\/[^\s<>"']+activate[^\s<>"']*|https?:\/\/[^\s<>"']+auth[^\s<>"']*)/gi;
  while ((match = urlRegex.exec(combined)) !== null) {
    const link = match[1].replace(/[.,;)]+$/, '');
    if (!results.some(r => r.code === link)) {
      results.push({
        code: link,
        type: 'link',
        label: 'Verification Link',
      });
    }
  }

  return results;
}

export function playChimeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Pleasant dual chime
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6
    gain2.gain.setValueAtTime(0.1, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.55);
  } catch (e) {
    // Web audio might be restricted without user interaction
  }
}
