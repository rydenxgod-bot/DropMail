import express from 'express';
import {
  LIVE_PROVIDERS,
  fetchLiveDomains,
  registerAndLoginAccount,
  fetchMessagesForToken,
  fetchMessageDetailForToken,
  deleteMessageForToken,
  deleteAccountForToken,
  getAccountDetailsForToken,
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

// Helper to extract Bearer token
function getBearerToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  return authHeader.replace(/^Bearer\s+/i, '').trim();
}

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

// 2. Atomic Create Endpoint
app.post('/api/mail/create', async (req, res) => {
  const { username, domain, address } = req.body || {};
  try {
    const fullAddress = address || (username && domain ? `${username}@${domain}` : undefined);
    const account = await registerAndLoginAccount(fullAddress, domain);
    return res.json(account);
  } catch (err: any) {
    console.error('Account creation error:', err.message);
    return res.status(500).json({ message: err.message || 'Failed to create live mailbox' });
  }
});

// Quick-create alias
app.post('/api/mail/quick-create', async (req, res) => {
  try {
    const account = await registerAndLoginAccount();
    return res.json(account);
  } catch (err: any) {
    console.error('Quick create error:', err.message);
    return res.status(500).json({ message: err.message || 'Failed to generate live mailbox' });
  }
});

// 3. Register Account Endpoint
app.post('/api/mail/accounts', async (req, res) => {
  const { address, username, domain } = req.body || {};
  try {
    const fullAddress = address || (username && domain ? `${username}@${domain}` : undefined);
    const acc = await registerAndLoginAccount(fullAddress, domain);
    return res.json(acc);
  } catch (e: any) {
    return res.status(500).json({ message: e.message || 'Registration failed' });
  }
});

// 4. Token / Login Endpoint
app.post('/api/mail/token', async (req, res) => {
  const { address } = req.body || {};
  try {
    const acc = await registerAndLoginAccount(address);
    return res.json({ token: acc.token });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Login failed' });
  }
});

// 5. Account Details / Me Endpoint
app.get('/api/mail/me', async (req, res) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: missing authorization token' });
  }

  try {
    const me = await getAccountDetailsForToken(token);
    if (me) {
      return res.json(me);
    }
    return res.status(401).json({ message: 'Account session expired' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Failed to fetch account' });
  }
});

// 6. Delete Account Endpoint
app.delete('/api/mail/accounts/:id', async (req, res) => {
  const token = getBearerToken(req);
  const { id } = req.params;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await deleteAccountForToken(token, id).catch(() => {});
  return res.status(204).send();
});

// 7. Messages List Endpoint
app.get('/api/mail/messages', async (req, res) => {
  const token = getBearerToken(req);
  const page = Number(req.query.page) || 1;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const messages = await fetchMessagesForToken(token, page);
    return res.json({
      'hydra:member': messages,
      'hydra:totalItems': messages.length,
    });
  } catch (err: any) {
    console.error('Messages list error:', err.message);
    return res.json({ 'hydra:member': [], 'hydra:totalItems': 0 });
  }
});

// 8. Message Details Endpoint
app.get('/api/mail/messages/:id', async (req, res) => {
  const token = getBearerToken(req);
  const { id } = req.params;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const message = await fetchMessageDetailForToken(token, id);
    if (message) {
      return res.json(message);
    }
    return res.status(404).json({ message: 'Message not found or expired' });
  } catch (err: any) {
    console.error('Message detail error:', err.message);
    return res.status(500).json({ message: err.message || 'Failed to fetch message' });
  }
});

// 9. Delete Message Endpoint
app.delete('/api/mail/messages/:id', async (req, res) => {
  const token = getBearerToken(req);
  const { id } = req.params;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await deleteMessageForToken(token, id).catch(() => {});
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
