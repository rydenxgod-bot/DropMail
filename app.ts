import express from 'express';
import {
  LIVE_PROVIDERS,
  domainProviderMap,
  getBaseUrlForDomain,
  apiFetch,
  fetchLiveDomains,
  registerAndLoginAccount,
} from './server/mailEngine.js';
import {
  processTelegramUpdate,
  setTelegramWebhook,
  getTelegramBotStatus,
} from './server/telegramBot.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for Vercel environments & preview deploys
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 1. Domains endpoint: Return live active domains from providers
app.get('/api/mail/domains', async (req, res) => {
  try {
    const domains = await fetchLiveDomains();
    return res.json({
      'hydra:member': domains,
      'hydra:totalItems': domains.length,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Failed to fetch domains' });
  }
});

// 2. Atomic Create / Quick Create Endpoint
app.post('/api/mail/create', async (req, res) => {
  const { username, domain, address } = req.body || {};
  try {
    const fullAddress = address || (username && domain ? `${username}@${domain}` : undefined);
    const account = await registerAndLoginAccount(fullAddress, domain);
    return res.json(account);
  } catch (err: any) {
    console.warn('Account creation attempt 1 note:', err.message);
    try {
      const retryAccount = await registerAndLoginAccount();
      return res.json(retryAccount);
    } catch (retryErr: any) {
      console.error('Account creation final error:', retryErr.message);
      return res.status(500).json({ message: retryErr.message || 'Failed to create live mailbox' });
    }
  }
});

// Quick-create alias
app.post('/api/mail/quick-create', async (req, res) => {
  try {
    const account = await registerAndLoginAccount();
    return res.json(account);
  } catch (err: any) {
    console.warn('Quick create attempt 1 note:', err.message);
    try {
      const retryAccount = await registerAndLoginAccount();
      return res.json(retryAccount);
    } catch (retryErr: any) {
      console.error('Quick create final error:', retryErr.message);
      return res.status(500).json({ message: retryErr.message || 'Failed to generate live mailbox' });
    }
  }
});

// 3. Register Account Endpoint
app.post('/api/mail/accounts', async (req, res) => {
  const { address, password, username, domain } = req.body || {};
  if (!address && (!username || !domain)) {
    try {
      const acc = await registerAndLoginAccount();
      return res.json(acc);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  }

  const fullAddress = address || `${username}@${domain}`;
  const targetDomain = fullAddress.split('@')[1] || domain || '';
  const baseUrl = getBaseUrlForDomain(targetDomain);

  try {
    const regRes = await apiFetch(`${baseUrl}/accounts`, {
      method: 'POST',
      body: JSON.stringify({ address: fullAddress, password }),
    }, 9000);

    const data = await regRes.json().catch(() => ({}));
    return res.status(regRes.status).json(data);
  } catch (err: any) {
    console.error('Account registration error:', err.message);
    return res.status(500).json({ message: err.message || 'Registration failed' });
  }
});

// 4. Token / Login Endpoint
app.post('/api/mail/token', async (req, res) => {
  const { address, password } = req.body;
  if (!address || !password) {
    return res.status(400).json({ message: 'Address and password required' });
  }

  const domain = address.split('@')[1] || '';
  const baseUrl = getBaseUrlForDomain(domain);

  try {
    const tokenRes = await apiFetch(`${baseUrl}/token`, {
      method: 'POST',
      body: JSON.stringify({ address, password }),
    }, 9000);

    if (tokenRes.ok) {
      const data = await tokenRes.json();
      return res.json(data);
    }

    // Try fallback provider
    const altBaseUrl = baseUrl.includes('mail.gw') ? 'https://api.mail.tm' : 'https://api.mail.gw';
    const altTokenRes = await apiFetch(`${altBaseUrl}/token`, {
      method: 'POST',
      body: JSON.stringify({ address, password }),
    }, 9000).catch(() => null);

    if (altTokenRes && altTokenRes.ok) {
      const altData = await altTokenRes.json();
      domainProviderMap.set(domain.toLowerCase(), altBaseUrl);
      return res.json(altData);
    }

    const errData = await tokenRes.json().catch(() => ({}));
    return res.status(tokenRes.status).json(errData);
  } catch (err: any) {
    console.error('Token fetch error:', err.message);
    return res.status(500).json({ message: err.message || 'Login failed' });
  }
});

// 5. Account Details / Me Endpoint
app.get('/api/mail/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized: missing authorization header' });
  }

  for (const provider of LIVE_PROVIDERS) {
    try {
      const meRes = await apiFetch(`${provider.baseUrl}/me`, {
        method: 'GET',
        headers: { Authorization: authHeader },
      }, 7000);

      if (meRes.ok) {
        const data = await meRes.json();
        return res.json(data);
      }
    } catch (e: any) {
      // Continue to next provider
    }
  }

  return res.status(401).json({ message: 'Account session expired' });
});

// 6. Delete Account Endpoint
app.delete('/api/mail/accounts/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const { id } = req.params;

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  for (const provider of LIVE_PROVIDERS) {
    try {
      const delRes = await apiFetch(`${provider.baseUrl}/accounts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: authHeader },
      }, 7000);

      if (delRes.status === 204 || delRes.ok) {
        return res.status(204).send();
      }
    } catch (e: any) {
      // Continue
    }
  }

  return res.status(204).send();
});

// 7. Messages List Endpoint
app.get('/api/mail/messages', async (req, res) => {
  const authHeader = req.headers.authorization;
  const page = req.query.page || '1';

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  for (const provider of LIVE_PROVIDERS) {
    try {
      const msgRes = await apiFetch(`${provider.baseUrl}/messages?page=${page}`, {
        method: 'GET',
        headers: { Authorization: authHeader },
      }, 8000);

      if (msgRes.ok) {
        const data = await msgRes.json();
        return res.json(data);
      }
    } catch (e: any) {
      // Continue
    }
  }

  return res.json({ 'hydra:member': [], 'hydra:totalItems': 0 });
});

// 8. Message Details & Seen Marker Endpoint
app.get('/api/mail/messages/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const { id } = req.params;

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  for (const provider of LIVE_PROVIDERS) {
    try {
      const msgRes = await apiFetch(`${provider.baseUrl}/messages/${id}`, {
        method: 'GET',
        headers: { Authorization: authHeader },
      }, 8000);

      if (msgRes.ok) {
        const data = await msgRes.json();
        // Mark as seen in background
        apiFetch(`${provider.baseUrl}/messages/${id}`, {
          method: 'PATCH',
          headers: { Authorization: authHeader },
          body: JSON.stringify({ seen: true }),
        }, 4000).catch(() => {});

        return res.json(data);
      }
    } catch (e: any) {
      // Continue
    }
  }

  return res.status(404).json({ message: 'Message not found or expired' });
});

// 9. Delete Message Endpoint
app.delete('/api/mail/messages/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const { id } = req.params;

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  for (const provider of LIVE_PROVIDERS) {
    try {
      const delRes = await apiFetch(`${provider.baseUrl}/messages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: authHeader },
      }, 7000);

      if (delRes.status === 204 || delRes.ok) {
        return res.status(204).send();
      }
    } catch (e: any) {
      // Continue
    }
  }

  return res.status(204).send();
});

// 10. Telegram Bot Endpoints
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    await processTelegramUpdate(req.body);
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('Telegram webhook error:', err);
    return res.status(200).json({ ok: false, error: err.message });
  }
});

app.get('/api/telegram/status', async (req, res) => {
  const status = await getTelegramBotStatus();
  return res.json(status);
});

app.get('/api/telegram/set-webhook', async (req, res) => {
  const webhookUrl = req.query.url as string;
  if (!webhookUrl) {
    return res.status(400).json({ error: 'url query parameter is required' });
  }
  const result = await setTelegramWebhook(webhookUrl);
  return res.json(result);
});

export default app;
