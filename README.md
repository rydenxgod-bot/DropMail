# 📬 DropMail — Disposable Temporary Email Service

> A high-speed, anonymous, disposable temporary email web client with instant real-time inbox sync, smart OTP/2FA code extraction, custom mailbox handles, and zero required configuration.

[![Vercel Ready](https://img.shields.io/badge/Vercel-Ready-black?style=flat-square&logo=vercel)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Telegram](https://img.shields.io/badge/Telegram-@RydenXGod-229ED9?style=flat-square&logo=telegram)](https://t.me/RydenXGod)

---

## ✨ Features

- 🆓 **100% Free & No API Keys Required**: Completely ready out of the box with zero external billing or complex setup.
- ⚡ **Real-Time Live Inbox**: Background 5-second synchronization with chime notifications for incoming emails.
- 🔑 **Smart OTP / PIN Extraction**: Automatically scans email text for 4–8 digit verification codes and provides a 1-click **Copy OTP** badge.
- 🪄 **Custom & Random Email Handles**: Generate anonymized random addresses or specify your own custom username across available active domains.
- 🌓 **Dark & Light Mode**: Sleek, eye-safe theme toggle with local preference persistence.
- 📱 **Mobile QR Code Generator**: Scan with your smartphone camera to quickly transfer addresses across devices.
- 🗄️ **Session Email History**: Keep track of created addresses within your session and switch between them seamlessly.
- 🔥 **One-Click Burn & Privacy**: Ephemeral storage with 1-click mailbox burning and session history wiping.
- 🛡️ **Zero Tracking / Zero PII**: No passwords, personal names, phone numbers, or credit cards required.

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm** or **bun** / **yarn** / **pnpm**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/rydenxgod-bot/DropMail.git
cd dropmail

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 🚢 Deployment

### 1. Deploy to Vercel (Recommended)

This project includes a pre-configured `vercel.json` and serverless API handlers for instant deployment on Vercel:

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Go to [Vercel Dashboard](https://vercel.com/new) and import your repository.
3. Keep default settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**! 🚀

Alternatively, deploy using the Vercel CLI:
```bash
npx vercel
```

---

### 2. Deploy with Node.js / VPS / Cloud Run

```bash
# 1. Build the frontend and bundle backend
npm run build

# 2. Start the production server
npm start
```

The application will bind to port `3000` (or `process.env.PORT`).

---

### 3. Deploy with Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t dropmail .
docker run -p 3000:3000 dropmail
```

---

## 📖 How to Use

1. **Get an Address**: Open the app. An anonymous temporary email is automatically assigned, or click **New Address** to choose a custom handle.
2. **Copy Address**: Click the address pill or **Copy** button to copy your email to the clipboard.
3. **Use Anywhere**: Paste the address on website signups, free trials, WiFi logins, or software testing.
4. **Receive Mail & Extract OTPs**: When an email arrives, view the message content, download attachments, or copy verification codes with a single click.
5. **Burn & Discard**: Click **Burn Mailbox** or **Clear History** to purge all temporary session data.

---

## 🤖 Telegram Bot Integration

DropMail includes an integrated Telegram Bot engine that lets you and your users manage disposable emails directly in Telegram with real-time push notifications!

### Bot Features:
- 📬 **`/start`** — Greets the user, creates a disposable address, and opens interactive keyboards.
- ✨ **`Generate New Email` (`/new`)** — Instantly provisions a fresh mailbox (with 5-second anti-spam cooldown).
- 🔄 **`Refresh Inbox` (`/refresh`)** — Checks active mailbox, detects OTP verification codes, and outputs full snippets.
- ⚡ **Real-Time Push Alerts** — Automatically pushes incoming emails & 1-tap OTP codes to the user's Telegram chat.
- 🌐 **`Open in DropMail Web` Button** — Direct link from any Telegram message to view full rich HTML and download attachments in the web app.
- 📢 **Channel Integration** — Inline button directly linking to [@RydenXGod](https://t.me/RydenXGod).

### Setting up the Telegram Bot:
1. Create a bot with [@BotFather](https://t.me/BotFather) on Telegram and copy your API token.
2. Add the token to your `.env` or cloud secrets:
   ```env
   TELEGRAM_BOT_TOKEN="your_bot_token_here"
   ```
3. Run the app:
   - **Long Polling (Default)**: Automatically starts when `TELEGRAM_BOT_TOKEN` is present with zero webhook setup required!
   - **Webhook (Optional for Serverless)**: Call `https://your-domain.com/api/telegram/set-webhook?url=https://your-domain.com/api/telegram/webhook`.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, DOMPurify
- **Backend / Proxy**: Express, Node.js fetch with resilient fallback routing
- **Deployment**: Vercel Serverless Ready (`vercel.json`), Docker, Cloud Run

---

## 💬 Community & Credits

- **Creator / Maintainer**: **RydenX**
- **Official Telegram Channel**: [@RydenXGod](https://t.me/RydenXGod) — Join for domain updates, release announcements, and direct chat!

---

## ⭐ Support & Star

If you find DropMail useful, please consider giving this project a **⭐️ Star** on GitHub!

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
