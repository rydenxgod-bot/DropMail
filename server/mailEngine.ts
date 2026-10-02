// Server-Side Mail Core Engine
// Shared between Express API endpoints and DropMail Telegram Bot

export const LIVE_PROVIDERS = [
  { name: 'mail.tm', baseUrl: 'https://api.mail.tm' },
  { name: 'mail.gw', baseUrl: 'https://api.mail.gw' },
];

export const domainProviderMap = new Map<string, string>();

// Seed default known active domains
domainProviderMap.set('uberip.com', 'https://api.mail.tm');
domainProviderMap.set('emalupe.com', 'https://api.mail.tm');
domainProviderMap.set('oakon.com', 'https://api.mail.gw');
domainProviderMap.set('teihu.com', 'https://api.mail.gw');
domainProviderMap.set('raleigh-construction.com', 'https://api.mail.gw');
domainProviderMap.set('pastryofistanbul.com', 'https://api.mail.gw');
domainProviderMap.set('questtechsystems.com', 'https://api.mail.gw');

// Health and rate-limit tracking for providers
const providerStatus = new Map<string, { throttledUntil: number }>();

function isProviderThrottled(baseUrl: string): boolean {
  const status = providerStatus.get(baseUrl);
  if (!status) return false;
  return Date.now() < status.throttledUntil;
}

function markProviderThrottled(baseUrl: string, durationMs = 3500) {
  providerStatus.set(baseUrl, { throttledUntil: Date.now() + durationMs });
}

export function getBaseUrlForDomain(domain?: string): string {
  if (!domain) return 'https://api.mail.tm';
  const normalized = domain.toLowerCase().trim();
  if (domainProviderMap.has(normalized)) {
    return domainProviderMap.get(normalized)!;
  }
  return 'https://api.mail.tm';
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

// Fetch live domains from upstream providers in parallel with fallback
export async function fetchLiveDomains(): Promise<any[]> {
  const allDomains: any[] = [];

  const results = await Promise.allSettled(
    LIVE_PROVIDERS.map(async (provider) => {
      const resp = await apiFetch(`${provider.baseUrl}/domains?page=1`, { method: 'GET' }, 5000);
      if (resp.ok) {
        const data = await resp.json();
        const list = data['hydra:member'] || [];
        const validItems: any[] = [];
        for (const item of list) {
          if (item.isActive !== false && item.domain) {
            const domainLower = item.domain.toLowerCase().trim();
            domainProviderMap.set(domainLower, provider.baseUrl);
            validItems.push({
              id: item.id || item['@id'] || item.domain,
              domain: item.domain,
              isActive: true,
              isPrivate: Boolean(item.isPrivate),
              provider: provider.name,
              baseUrl: provider.baseUrl,
              createdAt: item.createdAt || new Date().toISOString(),
              updatedAt: item.updatedAt || new Date().toISOString(),
            });
          }
        }
        return validItems;
      }
      return [];
    })
  );

  for (const res of results) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      allDomains.push(...res.value);
    }
  }

  const uniqueDomains = Array.from(
    new Map(allDomains.map((d) => [d.domain.toLowerCase(), d])).values()
  );

  if (uniqueDomains.length > 0) {
    return uniqueDomains;
  }

  return [
    { id: '1', domain: 'uberip.com', isActive: true, isPrivate: false, provider: 'mail.tm', baseUrl: 'https://api.mail.tm' },
    { id: '2', domain: 'oakon.com', isActive: true, isPrivate: false, provider: 'mail.gw', baseUrl: 'https://api.mail.gw' },
    { id: '3', domain: 'teihu.com', isActive: true, isPrivate: false, provider: 'mail.gw', baseUrl: 'https://api.mail.gw' },
    { id: '4', domain: 'questtechsystems.com', isActive: true, isPrivate: false, provider: 'mail.gw', baseUrl: 'https://api.mail.gw' },
  ];
}

// Unified robust account registration & login with multi-provider failover
export async function registerAndLoginAccount(requestedAddress?: string, requestedDomain?: string) {
  let lastError: any = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    let domainObjects: { domain: string; baseUrl: string }[] = [];

    if (requestedDomain) {
      domainObjects.push({
        domain: requestedDomain,
        baseUrl: getBaseUrlForDomain(requestedDomain),
      });
    }

    try {
      const liveList = await fetchLiveDomains();
      for (const d of liveList) {
        if (d.domain && !domainObjects.some((item) => item.domain.toLowerCase() === d.domain.toLowerCase())) {
          domainObjects.push({
            domain: d.domain,
            baseUrl: d.baseUrl || getBaseUrlForDomain(d.domain),
          });
        }
      }
    } catch (e) {
      // Fallback
    }

    const hardcodedFallbacks = [
      { domain: 'uberip.com', baseUrl: 'https://api.mail.tm' },
      { domain: 'oakon.com', baseUrl: 'https://api.mail.gw' },
      { domain: 'teihu.com', baseUrl: 'https://api.mail.gw' },
      { domain: 'questtechsystems.com', baseUrl: 'https://api.mail.gw' },
    ];

    for (const fb of hardcodedFallbacks) {
      if (!domainObjects.some((item) => item.domain.toLowerCase() === fb.domain.toLowerCase())) {
        domainObjects.push(fb);
      }
    }

    // Prioritize unthrottled providers
    domainObjects.sort((a, b) => {
      const aThrottled = isProviderThrottled(a.baseUrl);
      const bThrottled = isProviderThrottled(b.baseUrl);
      if (aThrottled && !bThrottled) return 1;
      if (!aThrottled && bThrottled) return -1;
      return 0;
    });

    for (const domObj of domainObjects) {
      const domain = domObj.domain;
      const primaryBaseUrl = domObj.baseUrl;
      const secondaryBaseUrl = primaryBaseUrl.includes('mail.gw') ? 'https://api.mail.tm' : 'https://api.mail.gw';

      let username = '';
      if (requestedAddress && requestedAddress.includes('@') && attempt === 1) {
        username = requestedAddress.split('@')[0];
      } else {
        username = 'inbox' + Math.floor(100000 + Math.random() * 900000) + Math.random().toString(36).substring(2, 6);
      }

      username = username.toLowerCase().replace(/[^a-z0-9._-]/g, '');
      if (!username) username = 'inbox' + Math.floor(100000 + Math.random() * 900000);

      const address = `${username}@${domain}`;
      const password = generatePassword();

      const baseUrlsToTry = [primaryBaseUrl, secondaryBaseUrl];

      for (const baseUrl of baseUrlsToTry) {
        if (isProviderThrottled(baseUrl) && baseUrlsToTry.length > 1) {
          continue;
        }

        try {
          const regRes = await apiFetch(`${baseUrl}/accounts`, {
            method: 'POST',
            body: JSON.stringify({ address, password }),
          }, 7000);

          if (regRes.status === 429) {
            markProviderThrottled(baseUrl, 3500);
            console.warn(`Provider ${baseUrl} rate limited (429) for ${address}, failing over...`);
            lastError = new Error('Provider rate limit, tried next');
            continue;
          }

          if (regRes.status >= 500) {
            markProviderThrottled(baseUrl, 3000);
            console.warn(`Provider ${baseUrl} server error (${regRes.status}), failing over...`);
            lastError = new Error(`Provider returned ${regRes.status}`);
            continue;
          }

          if (!regRes.ok) {
            const errJson = await regRes.json().catch(() => ({}));
            const msg = errJson['hydra:description'] || errJson.message || `Status ${regRes.status}`;
            console.warn(`Registration rejected for ${address} on ${baseUrl} (${msg}), trying next...`);
            lastError = new Error(msg);
            continue;
          }

          const regData = await regRes.json();
          await new Promise((r) => setTimeout(r, 150));

          // Obtain JWT Token
          const tokenRes = await apiFetch(`${baseUrl}/token`, {
            method: 'POST',
            body: JSON.stringify({ address, password }),
          }, 7000);

          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            domainProviderMap.set(domain.toLowerCase(), baseUrl);
            return {
              id: regData.id || tokenData.id,
              address,
              password,
              token: tokenData.token,
              createdAt: regData.createdAt || new Date().toISOString(),
            };
          }

          // Try token on alt base URL
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
        } catch (err: any) {
          console.warn(`Error trying ${address} on ${baseUrl}:`, err.message);
          lastError = err;
        }
      }
    }

    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  throw lastError || new Error('Failed to create account across all available providers and domains');
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
