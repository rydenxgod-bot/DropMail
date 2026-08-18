// Server-Side Mail Core Engine
// Shared between Express API endpoints and DropMail Telegram Bot

export const LIVE_PROVIDERS = [
  { name: 'mail.gw', baseUrl: 'https://api.mail.gw' },
  { name: 'mail.tm', baseUrl: 'https://api.mail.tm' },
];

export const domainProviderMap = new Map<string, string>();

// Seed default known active domains
domainProviderMap.set('oakon.com', 'https://api.mail.gw');
domainProviderMap.set('teihu.com', 'https://api.mail.gw');
domainProviderMap.set('raleigh-construction.com', 'https://api.mail.gw');
domainProviderMap.set('pastryofistanbul.com', 'https://api.mail.gw');
domainProviderMap.set('questtechsystems.com', 'https://api.mail.gw');
domainProviderMap.set('emalupe.com', 'https://api.mail.tm');

export function getBaseUrlForDomain(domain?: string): string {
  if (!domain) return 'https://api.mail.gw';
  const normalized = domain.toLowerCase().trim();
  if (domainProviderMap.has(normalized)) {
    return domainProviderMap.get(normalized)!;
  }
  return 'https://api.mail.gw';
}

export async function apiFetch(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/ld+json',
        'User-Agent': 'DropMail/2.0 (HighSpeed-Client)',
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

// Fetch live domains from upstream providers
export async function fetchLiveDomains(): Promise<any[]> {
  const allDomains: any[] = [];

  for (const provider of LIVE_PROVIDERS) {
    try {
      const resp = await apiFetch(`${provider.baseUrl}/domains?page=1`, { method: 'GET' }, 6000);
      if (resp.ok) {
        const data = await resp.json();
        const list = data['hydra:member'] || [];
        for (const item of list) {
          if (item.isActive !== false && item.domain) {
            domainProviderMap.set(item.domain.toLowerCase(), provider.baseUrl);
            allDomains.push({
              id: item.id || item['@id'] || item.domain,
              domain: item.domain,
              isActive: true,
              isPrivate: Boolean(item.isPrivate),
              provider: provider.name,
              createdAt: item.createdAt || new Date().toISOString(),
              updatedAt: item.updatedAt || new Date().toISOString(),
            });
          }
        }
      }
    } catch (e: any) {
      console.warn(`Could not fetch domains from ${provider.name}:`, e.message);
    }
  }

  const uniqueDomains = Array.from(
    new Map(allDomains.map((d) => [d.domain.toLowerCase(), d])).values()
  );

  if (uniqueDomains.length > 0) {
    return uniqueDomains;
  }

  return [
    { id: '1', domain: 'oakon.com', isActive: true, isPrivate: false, provider: 'mail.gw' },
    { id: '2', domain: 'teihu.com', isActive: true, isPrivate: false, provider: 'mail.gw' },
    { id: '3', domain: 'raleigh-construction.com', isActive: true, isPrivate: false, provider: 'mail.gw' },
    { id: '4', domain: 'pastryofistanbul.com', isActive: true, isPrivate: false, provider: 'mail.gw' },
    { id: '5', domain: 'questtechsystems.com', isActive: true, isPrivate: false, provider: 'mail.gw' },
  ];
}

// Unified robust account registration & login
export async function registerAndLoginAccount(requestedAddress?: string, requestedDomain?: string) {
  // Dynamically pull fresh active domains or fall back to known list
  let domainCandidates: string[] = [];
  
  if (requestedDomain) {
    domainCandidates.push(requestedDomain);
  }

  try {
    const liveList = await fetchLiveDomains();
    for (const d of liveList) {
      if (d.domain && !domainCandidates.includes(d.domain)) {
        domainCandidates.push(d.domain);
      }
    }
  } catch (e) {
    // Fallback if domain fetch fails
  }

  const fallbackList = ['emalupe.com', 'oakon.com', 'teihu.com', 'raleigh-construction.com', 'pastryofistanbul.com', 'questtechsystems.com'];
  for (const f of fallbackList) {
    if (!domainCandidates.includes(f)) {
      domainCandidates.push(f);
    }
  }

  let lastError: any = null;

  for (const domain of domainCandidates) {
    const baseUrl = getBaseUrlForDomain(domain);
    let username = '';
    
    if (requestedAddress && requestedAddress.includes('@')) {
      const parts = requestedAddress.split('@');
      username = parts[0];
    } else if (requestedAddress) {
      username = requestedAddress;
    } else {
      username = 'inbox' + Math.floor(100000 + Math.random() * 900000);
    }

    username = username.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    if (!username) username = 'inbox' + Math.floor(100000 + Math.random() * 900000);

    const address = `${username}@${domain}`;
    const password = generatePassword();

    try {
      // 1. Register
      const regRes = await apiFetch(`${baseUrl}/accounts`, {
        method: 'POST',
        body: JSON.stringify({ address, password }),
      }, 7000);

      if (regRes.status === 429) {
        console.warn(`Provider ${baseUrl} rate limited for ${address}, trying next domain...`);
        lastError = new Error('Provider rate limit, tried next');
        continue;
      }

      if (!regRes.ok) {
        const errJson = await regRes.json().catch(() => ({}));
        const msg = errJson['hydra:description'] || errJson.message || `Status ${regRes.status}`;
        console.warn(`Registration rejected for ${address} (${msg}), trying next...`);
        lastError = new Error(msg);
        continue;
      }

      const regData = await regRes.json();

      // Short delay for DB synchronization
      await new Promise((r) => setTimeout(r, 200));

      // 2. Obtain Token
      const tokenRes = await apiFetch(`${baseUrl}/token`, {
        method: 'POST',
        body: JSON.stringify({ address, password }),
      }, 7000);

      if (!tokenRes.ok) {
        const altBaseUrl = baseUrl.includes('mail.gw') ? 'https://api.mail.tm' : 'https://api.mail.gw';
        const altTokenRes = await apiFetch(`${altBaseUrl}/token`, {
          method: 'POST',
          body: JSON.stringify({ address, password }),
        }, 7000).catch(() => null);

        if (altTokenRes && altTokenRes.ok) {
          const altTokenData = await altTokenRes.json();
          domainProviderMap.set(domain.toLowerCase(), altBaseUrl);
          return {
            id: regData.id || altTokenData.id,
            address,
            password,
            token: altTokenData.token,
            createdAt: regData.createdAt || new Date().toISOString(),
          };
        }

        lastError = new Error(`Login failed (${tokenRes.status})`);
        continue;
      }

      const tokenData = await tokenRes.json();

      return {
        id: regData.id || tokenData.id,
        address,
        password,
        token: tokenData.token,
        createdAt: regData.createdAt || new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn(`Error trying domain ${domain}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to create account across all available domains');
}

// Fetch messages for a given JWT token with multi-provider fallback
export async function fetchMessagesForToken(token: string, page = 1): Promise<any[]> {
  for (const provider of LIVE_PROVIDERS) {
    try {
      const resp = await apiFetch(`${provider.baseUrl}/messages?page=${page}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }, 6000);

      if (resp.ok) {
        const data = await resp.json();
        return data['hydra:member'] || [];
      }
    } catch (e) {
      // Continue to next provider
    }
  }
  return [];
}

// Fetch single message detail
export async function fetchMessageDetailForToken(token: string, messageId: string): Promise<any | null> {
  for (const provider of LIVE_PROVIDERS) {
    try {
      const resp = await apiFetch(`${provider.baseUrl}/messages/${messageId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }, 7000);

      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      // Continue
    }
  }
  return null;
}
