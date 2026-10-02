// Telegram Bot Engine for DropMail
// Directly integrates with Mail Engine for instantaneous, fault-tolerant operation

import {
  registerAndLoginAccount,
  fetchMessagesForToken,
  fetchMessageDetailForToken,
} from './mailEngine.js';

interface ChatSession {
  chatId: number;
  address: string;
  token: string;
  id: string;
  createdAt: number;
  lastGeneratedAt: number;
  knownMessageIds: Set<string>;
}

const chatSessions = new Map<number, ChatSession>();
let isPollingActive = false;
let pollingOffset = 0;

const TELEGRAM_CHANNEL_URL = 'https://t.me/RydenXGod';

function getBotToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN || '';
  return token.trim() ? token.trim() : null;
}

function getAppUrl(): string {
  const url = process.env.APP_URL || '';
  if (url.trim()) return url.trim();
  return 'https://ais-dev-rb76rmjpd6kcifav4to23s-733434060771.asia-southeast1.run.app';
}

// Telegram API Helper
async function callTelegramApi(method: string, payload: any): Promise<any> {
  const token = getBotToken();
  if (!token) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error(`[TelegramBot] Error calling ${method}:`, err);
    return null;
  }
}

// Smart OTP / PIN extraction from email subject and content
export function extractOtpFromText(subject = '', intro = '', text = ''): string | null {
  const combined = `${subject} ${intro} ${text}`;
  const patterns = [
    /(?:code|otp|pin|verification|password|token)\s*(?:is|:|=|-)?\s*([0-9]{4,8})/i,
    /(?:code|otp|pin|verification)\s*(?:is|:|=|-)?\s*([A-Z0-9]{4,8})/i,
    /\b([0-9]{6})\b/,
    /\b([0-9]{4,8})\b/,
  ];

  for (const regex of patterns) {
    const match = combined.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Escape HTML special characters for safe Telegram HTML parsing
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Clean and extract full readable text from email detail (text / html / intro)
export function getFullEmailText(detail: any): string {
  if (!detail) return '';
  
  if (detail.text && typeof detail.text === 'string' && detail.text.trim().length > 0) {
    return detail.text.trim();
  }
  
  if (detail.html) {
    let rawHtml = '';
    if (Array.isArray(detail.html)) {
      rawHtml = detail.html.join('\n');
    } else if (typeof detail.html === 'string') {
      rawHtml = detail.html;
    }
    
    if (rawHtml) {
      // Replace line breaks and paragraphs with newlines
      const withBreaks = rawHtml
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<\/li>/gi, '\n');
      
      // Strip all remaining HTML tags
      const stripped = withBreaks.replace(/<[^>]*>?/gm, ' ');
      // Clean multiple whitespace while preserving newlines
      const cleaned = stripped
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (cleaned.length > 0) {
        return cleaned;
      }
    }
  }

  if (detail.intro && typeof detail.intro === 'string' && detail.intro.trim().length > 0) {
    return detail.intro.trim();
  }

  return '';
}

// Keyboard markup for Telegram chat
function getReplyKeyboard() {
  return {
    keyboard: [
      [{ text: '✨ Generate New Email' }, { text: '🔄 Refresh Inbox' }],
      [{ text: '📧 My Address' }, { text: '📢 Telegram Channel' }],
    ],
    resize_keyboard: true,
    persistent: true,
  };
}

// Inline buttons for quick actions
function getInlineActions(accountAddress?: string) {
  const appUrl = getAppUrl();
  return {
    inline_keyboard: [
      [
        { text: '🔄 Refresh Inbox', callback_data: 'refresh_inbox' },
        { text: '✨ New Address', callback_data: 'generate_new' },
      ],
      [
        { text: '📢 Join @RydenXGod', url: TELEGRAM_CHANNEL_URL },
        { text: '🌐 Open DropMail Web', url: appUrl },
      ],
    ],
  };
}

// Main Telegram Update Processor (Works for Webhook & Polling)
export async function processTelegramUpdate(update: any) {
  if (!update) return;

  // 1. Handle Inline Button Clicks (Callback Queries)
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message?.chat?.id;
    const data = cb.data;

    await callTelegramApi('answerCallbackQuery', { callback_query_id: cb.id });

    if (chatId) {
      if (data === 'refresh_inbox') {
        await handleRefreshCommand(chatId);
      } else if (data === 'generate_new') {
        await handleNewAddressCommand(chatId);
      } else if (data === 'my_address') {
        await handleAddressCommand(chatId);
      }
    }
    return;
  }

  // 2. Handle Text Messages & Commands
  const message = update.message;
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const rawText = message.text.trim();
  const lowerText = rawText.toLowerCase();
  const firstName = message.from?.first_name || 'there';

  if (lowerText.startsWith('/start') || lowerText === 'start') {
    await handleStartCommand(chatId, firstName);
  } else if (
    lowerText.includes('generate') ||
    lowerText.includes('new') ||
    lowerText === '/new' ||
    lowerText === '✨ generate new email'
  ) {
    await handleNewAddressCommand(chatId);
  } else if (
    lowerText.includes('refresh') ||
    lowerText.includes('inbox') ||
    lowerText.includes('check') ||
    lowerText === '/refresh' ||
    lowerText === '🔄 refresh inbox'
  ) {
    await handleRefreshCommand(chatId);
  } else if (
    lowerText.includes('address') ||
    lowerText.includes('email') ||
    lowerText === '/address' ||
    lowerText === '📧 my address'
  ) {
    await handleAddressCommand(chatId);
  } else if (
    lowerText.includes('channel') ||
    lowerText.includes('telegram') ||
    lowerText === '/channel' ||
    lowerText === '📢 telegram channel'
  ) {
    await handleChannelCommand(chatId);
  } else if (lowerText.startsWith('/help') || lowerText === 'help') {
    await handleHelpCommand(chatId);
  } else {
    // Default helpful response
    await handleAddressCommand(chatId);
  }
}

// 1. /start command: Assigns or creates a live account and sends welcome
async function handleStartCommand(chatId: number, firstName: string) {
  let session = chatSessions.get(chatId);

  if (!session) {
    try {
      const acc = await registerAndLoginAccount();
      session = {
        chatId,
        address: acc.address,
        token: acc.token,
        id: acc.id,
        createdAt: Date.now(),
        lastGeneratedAt: Date.now(),
        knownMessageIds: new Set(),
      };
      chatSessions.set(chatId, session);
    } catch (err: any) {
      console.error('[TelegramBot] Failed to create initial account on start:', err.message);
    }
  }

  const address = session?.address || 'inbox' + Math.floor(100000 + Math.random() * 900000) + '@oakon.com';

  const welcomeText = 
`👋 <b>Hello ${firstName}! Welcome to DropMail</b> 📬

I am your <b>100% Free & Anonymous</b> temporary disposable email assistant.

📬 <b>Your Active Disposable Address:</b>
<code>${address}</code>
<i>(Tap the address above to copy)</i>

⚡ <b>Features & How it Works:</b>
• Paste this address into any website, app signup, or verification form.
• Incoming emails & <b>OTP verification codes</b> will arrive here automatically in real time!
• Tap <b>✨ Generate New Email</b> anytime to create a fresh inbox.
• Tap <b>🔄 Refresh Inbox</b> to check for messages immediately.

📢 <b>Official Channel:</b> @RydenXGod`;

  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text: welcomeText,
    parse_mode: 'HTML',
    reply_markup: getReplyKeyboard(),
  });

  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text: '👇 <b>Quick Actions:</b>',
    parse_mode: 'HTML',
    reply_markup: getInlineActions(address),
  });
}

// 2. Generate New Address command with 5s cooldown
async function handleNewAddressCommand(chatId: number) {
  const session = chatSessions.get(chatId);
  const now = Date.now();

  if (session && now - session.lastGeneratedAt < 5000) {
    const waitSec = Math.ceil((5000 - (now - session.lastGeneratedAt)) / 1000);
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: `⏳ <b>Cooldown Active:</b> Please wait <b>${waitSec}s</b> before generating another address.`,
      parse_mode: 'HTML',
      reply_markup: getReplyKeyboard(),
    });
    return;
  }

  try {
    const acc = await registerAndLoginAccount();
    const newSession: ChatSession = {
      chatId,
      address: acc.address,
      token: acc.token,
      id: acc.id,
      createdAt: Date.now(),
      lastGeneratedAt: Date.now(),
      knownMessageIds: new Set(),
    };
    chatSessions.set(chatId, newSession);

    const successText = 
`✨ <b>New Disposable Address Created!</b>

📬 <code>${acc.address}</code>
<i>(Tap the address to copy)</i>

🔒 <b>Status:</b> Ready to receive incoming emails.
Incoming emails & OTP codes will be pushed to this chat instantly!`;

    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: successText,
      parse_mode: 'HTML',
      reply_markup: getReplyKeyboard(),
    });

    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: '👇 <b>Actions:</b>',
      parse_mode: 'HTML',
      reply_markup: getInlineActions(acc.address),
    });
  } catch (err: any) {
    console.error('[TelegramBot] New address generation error:', err.message);
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: '⚠️ Temporary server busy. Retrying domain allocation, please tap <b>✨ Generate New Email</b> again.',
      parse_mode: 'HTML',
      reply_markup: getReplyKeyboard(),
    });
  }
}

// 3. Refresh Inbox command
async function handleRefreshCommand(chatId: number) {
  let session = chatSessions.get(chatId);

  if (!session) {
    await handleStartCommand(chatId, 'there');
    return;
  }

  const messages = await fetchMessagesForToken(session.token);

  if (messages.length === 0) {
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: `📭 <b>Inbox is empty</b>\n\nActive Address:\n<code>${session.address}</code>\n\nNo emails received yet. Once an email is sent, it will arrive automatically or click <b>Refresh</b>.`,
      parse_mode: 'HTML',
      reply_markup: getReplyKeyboard(),
    });
    return;
  }

  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text: `📬 <b>You have ${messages.length} message(s) in your mailbox:</b>\nAddress: <code>${session.address}</code>`,
    parse_mode: 'HTML',
  });

  for (const msg of messages.slice(0, 5)) {
    session.knownMessageIds.add(msg.id);

    // Fetch full email message body and details
    const detail = await fetchMessageDetailForToken(session.token, msg.id).catch(() => null) || msg;
    const fromAddr = escapeHtml(detail.from?.address || detail.from?.name || msg.from?.address || msg.from?.name || 'Unknown Sender');
    const rawSubject = detail.subject || msg.subject || '(No Subject)';
    const subject = escapeHtml(rawSubject);
    const fullBody = getFullEmailText(detail) || msg.intro || '';
    const otp = extractOtpFromText(rawSubject, msg.intro || '', fullBody);
    const dateStr = new Date(detail.createdAt || msg.createdAt || Date.now()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    let msgText = `📩 <b>From:</b> ${fromAddr}\n🏷️ <b>Subject:</b> ${subject}\n⏰ <b>Time:</b> ${dateStr}\n`;

    if (otp) {
      msgText += `\n🔑 <b>Verification OTP:</b> <code>${otp}</code> <i>(Tap to copy)</i>\n`;
    }

    if (fullBody) {
      // Safe display for Telegram message limits (max 3200 chars for body)
      let displayedBody = fullBody;
      if (displayedBody.length > 3200) {
        displayedBody = displayedBody.substring(0, 3200) + '\n... <i>[Full email text continues in browser]</i>';
      }
      msgText += `\n📄 <b>Message:</b>\n${escapeHtml(displayedBody)}\n`;
    }

    const appUrl = getAppUrl();
    await callTelegramApi('sendMessage', {
      chat_id: chatId,
      text: msgText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🌐 Open DropMail', url: appUrl },
            { text: '📢 @RydenXGod', url: TELEGRAM_CHANNEL_URL },
          ],
        ],
      },
    });
  }
}

// 4. Address info command
async function handleAddressCommand(chatId: number) {
  let session = chatSessions.get(chatId);
  if (!session) {
    await handleStartCommand(chatId, 'there');
    return;
  }

  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text: `📬 <b>Your Active Disposable Address:</b>\n<code>${session.address}</code>\n<i>(Tap above to copy)</i>\n\nUse the buttons below to generate a new address or refresh your inbox.`,
    parse_mode: 'HTML',
    reply_markup: getReplyKeyboard(),
  });
}

// 5. Channel link command
async function handleChannelCommand(chatId: number) {
  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text: `📢 <b>Official Telegram Channel</b>\n\nJoin <b>@RydenXGod</b> for domain updates, announcements, and direct creator chat!\n\nLink: ${TELEGRAM_CHANNEL_URL}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📢 Join @RydenXGod Channel', url: TELEGRAM_CHANNEL_URL }],
      ],
    },
  });
}

// 6. Help command
async function handleHelpCommand(chatId: number) {
  const helpText = 
`ℹ️ <b>DropMail Bot Commands:</b>

• /start - Start or restart the bot and get your address
• /new - Generate a new disposable email address
• /refresh - Check for new incoming emails
• /address - Show your current active address
• /channel - Official channel link (@RydenXGod)
• /help - Display this command guide

All services are 100% free with zero configuration!`;

  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text: helpText,
    parse_mode: 'HTML',
    reply_markup: getReplyKeyboard(),
  });
}

// Auto-push real-time notifications for incoming emails across all active bot users
async function runAutoForwardingCheck() {
  const token = getBotToken();
  if (!token) return;

  for (const [chatId, session] of chatSessions.entries()) {
    try {
      const messages = await fetchMessagesForToken(session.token);
      const newMessages = messages.filter((m) => !session.knownMessageIds.has(m.id));

      if (newMessages.length > 0) {
        for (const msg of newMessages) {
          session.knownMessageIds.add(msg.id);

          // Fetch full message body
          const detail = await fetchMessageDetailForToken(session.token, msg.id).catch(() => null) || msg;
          const fromAddr = escapeHtml(detail.from?.address || detail.from?.name || msg.from?.address || msg.from?.name || 'Unknown Sender');
          const rawSubject = detail.subject || msg.subject || '(No Subject)';
          const subject = escapeHtml(rawSubject);
          const fullBody = getFullEmailText(detail) || msg.intro || '';
          const otp = extractOtpFromText(rawSubject, msg.intro || '', fullBody);
          const dateStr = new Date(detail.createdAt || msg.createdAt || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          let alertText = `🔔 <b>NEW EMAIL RECEIVED!</b>\n\n📬 <b>To:</b> <code>${session.address}</code>\n📩 <b>From:</b> ${fromAddr}\n🏷️ <b>Subject:</b> ${subject}\n⏰ <b>Time:</b> ${dateStr}\n`;

          if (otp) {
            alertText += `\n🔑 <b>VERIFICATION CODE:</b> <code>${otp}</code>\n<i>(Tap code above to copy)</i>\n`;
          }

          if (fullBody) {
            let displayedBody = fullBody;
            if (displayedBody.length > 3200) {
              displayedBody = displayedBody.substring(0, 3200) + '\n... <i>[Full email text continues in browser]</i>';
            }
            alertText += `\n📄 <b>Full Message:</b>\n${escapeHtml(displayedBody)}\n`;
          }

          const appUrl = getAppUrl();
          await callTelegramApi('sendMessage', {
            chat_id: chatId,
            text: alertText,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🌐 Open DropMail', url: appUrl },
                  { text: '📢 @RydenXGod', url: TELEGRAM_CHANNEL_URL },
                ],
              ],
            },
          });
        }
      }
    } catch (e: any) {
      // Ignore individual session polling hiccups
    }
  }
}

// Long-polling loop for Telegram updates
async function startLongPolling() {
  const token = getBotToken();
  if (!token || isPollingActive) return;

  isPollingActive = true;
  console.log('[TelegramBot] Starting long-polling service...');

  while (isPollingActive) {
    try {
      const resp = await fetch(
        `https://api.telegram.org/bot${token}/getUpdates?offset=${pollingOffset}&timeout=15`,
        { method: 'GET' }
      );

      if (resp.ok) {
        const data = await resp.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            pollingOffset = update.update_id + 1;
            await processTelegramUpdate(update).catch((err) => {
              console.error('[TelegramBot] Error processing update:', err);
            });
          }
        }
      } else {
        await new Promise((r) => setTimeout(r, 4000));
      }
    } catch (e: any) {
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
}

// Initialize Telegram Bot system
export function initTelegramBot() {
  const token = getBotToken();
  if (!token) {
    console.log('[TelegramBot] TELEGRAM_BOT_TOKEN is not set. Add it to environment or settings to activate the bot.');
    return;
  }

  console.log('[TelegramBot] Initializing DropMail Telegram Bot engine...');

  // Start polling
  startLongPolling().catch((e) => console.error('[TelegramBot] Polling loop error:', e));

  // Run auto-push checker every 5 seconds
  setInterval(() => {
    runAutoForwardingCheck().catch(() => {});
  }, 5000);
}

// Webhook setup
export async function setTelegramWebhook(webhookUrl: string) {
  const token = getBotToken();
  if (!token) return { success: false, error: 'TELEGRAM_BOT_TOKEN not set' };

  isPollingActive = false;
  const res = await callTelegramApi('setWebhook', { url: webhookUrl });
  return { success: res?.ok || false, response: res };
}

// Status check
export async function getTelegramBotStatus() {
  const token = getBotToken();
  if (!token) {
    return {
      enabled: false,
      message: 'TELEGRAM_BOT_TOKEN is not set. Add it in environment or secrets.',
    };
  }

  const me = await callTelegramApi('getMe', {});
  return {
    enabled: true,
    bot: me?.result || null,
    activeSessionsCount: chatSessions.size,
    channel: TELEGRAM_CHANNEL_URL,
  };
}
