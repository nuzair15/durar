# 💎 Durar

> Your personal AI assistant on every platform.
> Powered by [OpenClaw](https://github.com/openclaw/openclaw).

---

## Install

```bash
npm install -g durar
```

Requires **Node.js 20+**. That's it — no other setup needed.

---

## Usage

`durar` works exactly like `openclaw`. Every command is identical:

```bash
durar onboard              # first-time setup + daemon install
durar doctor               # check your installation
durar gateway run          # start the message gateway
durar telegram setup       # connect Telegram
durar whatsapp setup       # connect WhatsApp
durar slack setup          # connect Slack
durar discord setup        # connect Discord
durar agent --message "Hi" # test your AI agent directly
durar --version            # show version
```

Config and data are stored in **`~/.durar/`** instead of `~/.openclaw/`.

---

## Coming from OpenClaw?

If you already have OpenClaw configured, migrate your data in one command:

```bash
durar migrate
```

This copies `~/.openclaw/` → `~/.durar/` non-destructively.
Your existing `openclaw` command keeps working unchanged.

---

## Durar GUI

Install the visual dashboard to configure everything without touching the terminal:

```bash
# 1. Download durar-gui from https://github.com/durar-app/durar-gui/releases
# 2. Run the installer
# 3. Open http://localhost:7891 in your browser
```

---

## Updates

Durar automatically syncs with the upstream OpenClaw release every 6 hours.
When a new version of OpenClaw ships, a new version of Durar is published
to npm within hours.

To update manually:

```bash
npm install -g durar@latest
```

---

## Supported Platforms

| OS | Support |
|---|---|
| macOS 12+ | ✅ Full |
| Linux (x86_64 / ARM) | ✅ Full |
| Windows 10/11 | ✅ Full |

---

## License

MIT — see [LICENSE](LICENSE).
Builds on [OpenClaw](https://github.com/openclaw/openclaw) (MIT).
