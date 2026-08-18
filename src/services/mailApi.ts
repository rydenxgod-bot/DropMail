import { Domain, AccountCredentials, MessageSummary, MessageDetail } from '../types';

const API_BASE = '/api/mail';

export class MailApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'MailApiError';
  }
}

export async function fetchDomains(): Promise<Domain[]> {
  try {
    const res = await fetch(`${API_BASE}/domains?page=1`);
    if (!res.ok) {
      throw new MailApiError(`Failed to fetch domains: ${res.statusText}`, res.status);
    }
    const data = await res.json();
    const domains: Domain[] = (data['hydra:member'] || []).filter((d: Domain) => d.isActive);
    if (domains.length === 0) {
      throw new MailApiError('No active live domains available');
    }
    return domains;
  } catch (err: any) {
    console.error('fetchDomains error:', err);
    throw new MailApiError(err.message || 'Network error fetching live domains');
  }
}

export function generateRandomUsername(): string {
  const adjectives = [
    'swift', 'bright', 'cyber', 'quick', 'cool', 'silent', 'cosmic', 'zen',
    'hyper', 'ultra', 'amber', 'shadow', 'frost', 'pixel', 'vivid', 'turbo',
    'echo', 'spark', 'cloud', 'nexus', 'pulse', 'prime', 'stellar', 'matrix'
  ];
  const nouns = [
    'fox', 'falcon', 'wave', 'coder', 'star', 'pilot', 'runner', 'wolf',
    'hawk', 'orbit', 'knight', 'spark', 'storm', 'beacon', 'blade', 'rover',
    'scout', 'tiger', 'nexus', 'drifter', 'ghost', 'vortex', 'cipher', 'lynx'
  ];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}.${noun}${num}`;
}

export function generateRandomPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let pass = '';
  for (let i = 0; i < 16; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export async function createAccount(
  customUsername?: string,
  domainChoice?: string
): Promise<AccountCredentials> {
  const cleanUsername = customUsername
    ? customUsername.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '')
    : undefined;

  // 1. Primary: Use atomic /api/mail/create endpoint with server-side retry and fallback
  try {
    const res = await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanUsername,
        domain: domainChoice,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.address && data.token) {
        return {
          id: data.id,
          address: data.address,
          password: data.password,
          token: data.token,
          createdAt: data.createdAt || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('Atomic create failed, attempting quick-create fallback:', err);
  }

  // 2. Fallback: Try quick-create
  try {
    const quickRes = await fetch(`${API_BASE}/quick-create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (quickRes.ok) {
      const quickData = await quickRes.json();
      if (quickData.address && quickData.token) {
        return {
          id: quickData.id,
          address: quickData.address,
          password: quickData.password,
          token: quickData.token,
          createdAt: quickData.createdAt || new Date().toISOString(),
        };
      }
    }
  } catch (quickErr) {
    console.warn('Quick-create fallback failed:', quickErr);
  }

  throw new MailApiError('Failed to generate temporary email address. Please try again.');
}

export async function authenticateExistingAccount(address: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  });

  if (!res.ok) {
    throw new MailApiError(`Failed to authenticate: invalid credentials`, res.status);
  }

  const data = await res.json();
  return data.token;
}

export async function fetchMessages(token: string, page = 1): Promise<{ messages: MessageSummary[]; total: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(`${API_BASE}/messages?page=${page}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 401) {
      throw new MailApiError('Session expired', 401);
    }

    if (!res.ok) {
      throw new MailApiError(`Failed to fetch messages: ${res.statusText}`, res.status);
    }

    const data = await res.json();
    return {
      messages: data['hydra:member'] || [],
      total: data['hydra:totalItems'] || 0,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err instanceof MailApiError) throw err;
    if (err.name === 'AbortError') {
      throw new MailApiError('Request timed out', 408);
    }
    throw new MailApiError(err.message || 'Failed to fetch messages', 500);
  }
}

export async function fetchMessageDetail(token: string, messageId: string): Promise<MessageDetail> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(`${API_BASE}/messages/${messageId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new MailApiError(`Failed to fetch message detail: ${res.statusText}`, res.status);
    }

    const data: MessageDetail = await res.json();
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err instanceof MailApiError) throw err;
    throw new MailApiError(err.message || 'Failed to fetch message details');
  }
}

export async function deleteMessage(token: string, messageId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/messages/${messageId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.ok || res.status === 204 || res.status === 404;
}

export async function markMessageAsSeen(token: string, messageId: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/messages/${messageId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/merge-patch+json',
      },
      body: JSON.stringify({ seen: true }),
    });
  } catch (e) {
    // Non-critical
  }
}

export async function deleteAccount(token: string, accountId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/accounts/${accountId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}
