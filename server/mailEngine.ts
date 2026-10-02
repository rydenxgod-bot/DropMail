// Server-Side Mail Core Engine
// Primary Provider: GuerrillaMail (Reliable public REST API, zero IP/region restrictions on Vercel)
// Secondary Fallback: Mail.tm / Mail.gw

export const GUERRILLA_HOSTS = [
  'https://api.guerrillamail.com/ajax.php',
  'https://www.guerrillamail.com/ajax.php',
];

export const GUERRILLA_DOMAINS = [
  'guerrillamail.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'grr.la',
  'pokemail.net',
  'spam4.me',
];

export const LIVE_PROVIDERS = [
  { name: 'GuerrillaMail', baseUrl: GUERRILLA_HOSTS[0] },
  { name: 'mail.tm', baseUrl: 'https://api.mail.tm' },
  { name: 'mail.gw', baseUrl: 'https://api.mail.gw' },
];

export const domainProviderMap = new Map<string, string>();

for (const d of GUERRILLA_DOMAINS) {
  domainProviderMap.set(d.toLowerCase(), 'GuerrillaMail');
}
domainProviderMap.set('uberip.com', 'https://api.mail.tm');
domainProviderMap.set('emalupe.com', 'https://api.mail.tm');
domainProviderMap.set('oakon.com', 'https://api.mail.gw');

export function getBaseUrlForDomain(domain?: string): string {
  if (!domain) return GUERRILLA_HOSTS[0];
  const normalized = domain.toLowerCase().trim();
  if (domainProviderMap.has(normalized)) {
    const val = domainProviderMap.get(normalized)!;
    if (val === 'GuerrillaMail') return GUERRILLA_HOSTS[0];
    return val;
  }
  return GUERRILLA_HOSTS[0];
}

export async function apiFetch(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'DropMail-Vercel/3.0 (Reliable Mail Engine)',
        ...(options.headers || {}),
      },
    });
    clearTimeout(id);
    return res;
  } catch (err: any) {
    clearTimeout(id);
    throw err;
  }
}

export function generatePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let pass = '';
  for (let i = 0; i < 16; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// 1. Fetch live active domains
export async function fetchLiveDomains(): Promise<any[]> {
  const domainList = GUERRILLA_DOMAINS.map((domain, index) => ({
    id: String(index + 1),
    domain,
    isActive: true,
    isPrivate: false,
    provider: 'GuerrillaMail',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return domainList;
}

// Helper: Call GuerrillaMail with host failover
async function callGuerrillaApi(query: string, timeout = 7000): Promise<any> {
  let lastError: any = null;
  for (const host of GUERRILLA_HOSTS) {
    try {
      const url = `${host}?${query}`;
      const res = await apiFetch(url, { method: 'GET' }, timeout);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('GuerrillaMail API unreachable');
}

// 2. Primary: Register & Login Account via GuerrillaMail (with fallback to Mail.tm)
export async function registerAndLoginAccount(requestedAddress?: string, requestedDomain?: string) {
  // Try GuerrillaMail first (No IP block, Vercel-compatible)
  try {
    const initData = await callGuerrillaApi('f=get_email_address');
    if (initData && initData.sid_token) {
      let finalAddress = initData.email_addr;
      const sid = initData.sid_token;

      // If user specified username or domain, try setting email user
      if (requestedAddress || requestedDomain) {
        let desiredUser = '';
        if (requestedAddress && requestedAddress.includes('@')) {
          desiredUser = requestedAddress.split('@')[0];
        } else if (requestedAddress) {
          desiredUser = requestedAddress;
        }

        desiredUser = desiredUser.toLowerCase().replace(/[^a-z0-9._-]/g, '');

        if (desiredUser) {
          const setData = await callGuerrillaApi(
            `f=set_email_user&email_user=${encodeURIComponent(desiredUser)}&sid_token=${encodeURIComponent(sid)}`
          ).catch(() => null);

          if (setData && setData.email_addr) {
            finalAddress = setData.email_addr;
          }
        }
      }

      // If a specific Guerrilla domain was requested, apply it
      if (requestedDomain && GUERRILLA_DOMAINS.includes(requestedDomain.toLowerCase())) {
        const usernamePart = finalAddress.split('@')[0];
        finalAddress = `${usernamePart}@${requestedDomain.toLowerCase()}`;
      } else if (!requestedDomain && finalAddress.endsWith('@guerrillamailblock.com')) {
        // Prefer sharklasers.com or guerrillamail.com for clean aesthetic
        const usernamePart = finalAddress.split('@')[0];
        finalAddress = `${usernamePart}@sharklasers.com`;
      }

      return {
        id: sid,
        address: finalAddress,
        password: generatePassword(),
        token: `gm_${sid}`,
        createdAt: new Date().toISOString(),
      };
    }
  } catch (gmError: any) {
    console.warn('GuerrillaMail initial attempt failed, attempting fallback:', gmError.message);
  }

  // Secondary Fallback: Mail.tm / Mail.gw
  const fallbackEndpoints = ['https://api.mail.tm', 'https://api.mail.gw'];
  for (const baseUrl of fallbackEndpoints) {
    try {
      const domResp = await apiFetch(`${baseUrl}/domains?page=1`, { method: 'GET' }, 4000);
      if (!domResp.ok) continue;
      const domData = await domResp.json();
      const availableDomains = (domData['hydra:member'] || []).filter((d: any) => d.isActive);
      if (availableDomains.length === 0) continue;

      const domain = availableDomains[0].domain;
      const username = 'inbox' + Math.floor(100000 + Math.random() * 900000);
      const address = `${username}@${domain}`;
      const password = generatePassword();

      const regRes = await apiFetch(`${baseUrl}/accounts`, {
        method: 'POST',
        body: JSON.stringify({ address, password }),
      }, 5000);

      if (!regRes.ok) continue;
      const regData = await regRes.json();

      await new Promise((r) => setTimeout(r, 200));

      const tokenRes = await apiFetch(`${baseUrl}/token`, {
        method: 'POST',
        body: JSON.stringify({ address, password }),
      }, 5000);

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        return {
          id: regData.id || tokenData.id,
          address,
          password,
          token: tokenData.token,
          createdAt: regData.createdAt || new Date().toISOString(),
        };
      }
    } catch (e: any) {
      // Continue to next fallback
    }
  }

  throw new Error('All temporary email providers are currently unavailable. Please try again.');
}

// 3. Fetch Messages for Token
export async function fetchMessagesForToken(token: string, page = 1): Promise<any[]> {
  const cleanToken = token.trim();

  // Route 1: GuerrillaMail Session Token
  if (cleanToken.startsWith('gm_') || !cleanToken.includes('.')) {
    const sid = cleanToken.replace(/^gm_/, '');
    try {
      const data = await callGuerrillaApi(`f=get_email_list&offset=0&sid_token=${encodeURIComponent(sid)}`);
      if (data && Array.isArray(data.list)) {
        return data.list.map((item: any) => {
          const fromAddress = item.mail_from || 'sender@guerrillamail.com';
          const fromName = fromAddress.split('@')[0] || 'Sender';
          const createdAt = item.mail_timestamp
            ? new Date(Number(item.mail_timestamp) * 1000).toISOString()
            : new Date().toISOString();

          return {
            id: String(item.mail_id),
            accountId: sid,
            msgid: String(item.mail_id),
            from: { address: fromAddress, name: fromName },
            to: [{ address: data.email || 'user@guerrillamail.com', name: 'Recipient' }],
            subject: item.mail_subject || '(No Subject)',
            intro: item.mail_excerpt ? stripHtml(item.mail_excerpt) : '',
            seen: Boolean(item.mail_read && item.mail_read !== 0),
            isDeleted: false,
            hasAttachments: Boolean(item.att && item.att > 0),
            size: item.size || (item.mail_body ? item.mail_body.length : 1024),
            downloadUrl: '',
            createdAt,
            updatedAt: createdAt,
          };
        });
      }
    } catch (err: any) {
      console.warn('GuerrillaMail message fetch error:', err.message);
    }
    return [];
  }

  // Route 2: Mail.tm / Mail.gw JWT Fallback
  for (const provider of ['https://api.mail.tm', 'https://api.mail.gw']) {
    try {
      const resp = await apiFetch(`${provider}/messages?page=${page}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${cleanToken}` },
      }, 5000);

      if (resp.ok) {
        const data = await resp.json();
        return data['hydra:member'] || [];
      }
    } catch {
      // Continue
    }
  }

  return [];
}

// 4. Fetch Message Detail for Token
export async function fetchMessageDetailForToken(token: string, messageId: string): Promise<any | null> {
  const cleanToken = token.trim();

  // Route 1: GuerrillaMail
  if (cleanToken.startsWith('gm_') || !cleanToken.includes('.')) {
    const sid = cleanToken.replace(/^gm_/, '');
    try {
      const item = await callGuerrillaApi(
        `f=fetch_email&email_id=${encodeURIComponent(messageId)}&sid_token=${encodeURIComponent(sid)}`
      );

      if (item && item.mail_id) {
        const rawBody = item.mail_body || item.mail_excerpt || '';
        const plainText = stripHtml(rawBody);
        const fromAddress = item.mail_from || 'sender@guerrillamail.com';
        const fromName = fromAddress.split('@')[0] || 'Sender';
        const createdAt = item.mail_timestamp
          ? new Date(Number(item.mail_timestamp) * 1000).toISOString()
          : new Date().toISOString();

        return {
          id: String(item.mail_id),
          accountId: sid,
          msgid: String(item.mail_id),
          from: { address: fromAddress, name: fromName },
          to: [{ address: item.mail_recipient ? `${item.mail_recipient}@sharklasers.com` : 'inbox', name: 'Recipient' }],
          cc: [],
          bcc: [],
          subject: item.mail_subject || '(No Subject)',
          seen: true,
          flagged: false,
          isDeleted: false,
          retention: false,
          retentionDate: '',
          text: plainText,
          html: [rawBody],
          hasAttachments: Boolean(item.att && item.att > 0),
          attachments: [],
          size: item.size || rawBody.length,
          downloadUrl: '',
          createdAt,
          updatedAt: createdAt,
        };
      }
    } catch (err: any) {
      console.warn('GuerrillaMail message detail error:', err.message);
    }
    return null;
  }

  // Route 2: Mail.tm / Mail.gw Fallback
  for (const provider of ['https://api.mail.tm', 'https://api.mail.gw']) {
    try {
      const resp = await apiFetch(`${provider}/messages/${messageId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${cleanToken}` },
      }, 6000);

      if (resp.ok) {
        return await resp.json();
      }
    } catch {
      // Continue
    }
  }

  return null;
}

// 5. Delete Message for Token
export async function deleteMessageForToken(token: string, messageId: string): Promise<boolean> {
  const cleanToken = token.trim();

  if (cleanToken.startsWith('gm_') || !cleanToken.includes('.')) {
    const sid = cleanToken.replace(/^gm_/, '');
    try {
      await callGuerrillaApi(
        `f=del_email&email_ids%5B%5D=${encodeURIComponent(messageId)}&sid_token=${encodeURIComponent(sid)}`
      );
      return true;
    } catch {
      return false;
    }
  }

  // Mail.tm fallback
  for (const provider of ['https://api.mail.tm', 'https://api.mail.gw']) {
    try {
      const delRes = await apiFetch(`${provider}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${cleanToken}` },
      }, 5000);

      if (delRes.status === 204 || delRes.ok) {
        return true;
      }
    } catch {
      // Continue
    }
  }

  return true;
}

// 6. Delete Account for Token
export async function deleteAccountForToken(token: string, accountId: string): Promise<boolean> {
  const cleanToken = token.trim();

  if (cleanToken.startsWith('gm_') || !cleanToken.includes('.')) {
    // GuerrillaMail sessions expire automatically after 1 hour or can be dropped
    return true;
  }

  for (const provider of ['https://api.mail.tm', 'https://api.mail.gw']) {
    try {
      const delRes = await apiFetch(`${provider}/accounts/${accountId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${cleanToken}` },
      }, 5000);

      if (delRes.status === 204 || delRes.ok) {
        return true;
      }
    } catch {
      // Continue
    }
  }

  return true;
}

// 7. Get Account Profile for Token
export async function getAccountDetailsForToken(token: string): Promise<any | null> {
  const cleanToken = token.trim();

  if (cleanToken.startsWith('gm_') || !cleanToken.includes('.')) {
    const sid = cleanToken.replace(/^gm_/, '');
    try {
      const data = await callGuerrillaApi(`f=check_email&seq=0&sid_token=${encodeURIComponent(sid)}`);
      if (data && data.email) {
        return {
          id: sid,
          address: data.email,
        };
      }
    } catch {
      // Fallback
    }
    return { id: sid, address: 'inbox@sharklasers.com' };
  }

  for (const provider of ['https://api.mail.tm', 'https://api.mail.gw']) {
    try {
      const meRes = await apiFetch(`${provider}/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${cleanToken}` },
      }, 5000);

      if (meRes.ok) {
        return await meRes.json();
      }
    } catch {
      // Continue
    }
  }

  return null;
}
