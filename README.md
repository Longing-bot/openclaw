# 🦞 OpenClaw — Personal AI Assistant

<p align="center">
    <picture>
        <source media="(prefers-color-prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/openclaw/openclaw/main/docs/assets/openclaw-logo-text-dark.svg">
        <img src="https://raw.githubusercontent.com/openclaw/openclaw/main/docs/assets/openclaw-logo-text.svg" alt="OpenClaw" width="500">
    </picture>
</p>

<p align="center">
  <strong>EXFOLIATE! EXFOLIATE!</strong>
</p>

<p align="center">
  <a href="https://github.com/openclaw/openclaw/actions/workflows/ci.yml?branch=main"><img src="https://img.shields.io/github/actions/workflow/status/openclaw/openclaw/ci.yml?branch=main&style=for-the-badge" alt="CI status"></a>
  <a href="https://github.com/openclaw/openclaw/releases"><img src="https://img.shields.io/github/v/release/openclaw/openclaw?include_prereleases&style=for-the-badge" alt="GitHub release"></a>
  <a href="https://discord.gg/clawd"><img src="https://img.shields.io/discord/1456350064065904867?label=Discord&logo=discord&logoColor=white&color=5865F2&style=for-the-badge" alt="Discord"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

**OpenClaw** is a _personal AI assistant_ you run on your own devices.
It answers you on the channels you already use (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, BlueBubbles, IRC, Microsoft Teams, Matrix, Feishu, LINE, Mattermost, Nextcloud Talk, Nostr, Synology Chat, Tlon, Twitch, Zalo, Zalo Personal, WebChat). It can speak and listen on macOS/iOS/Android, and can render a live Canvas you control. The Gateway is just the control plane — the product is the assistant.

If you want a personal, single-user assistant that feels local, fast, and always-on, this is it.

[Website](https://openclaw.ai) · [Docs](https://docs.openclaw.ai) · [Vision](VISION.md) · [DeepWiki](https://deepwiki.com/openclaw/openclaw) · [Getting Started](https://docs.openclaw.ai/getting-started)

## 🚀 Quick Start

```bash
# Install OpenClaw
npm install -g openclaw

# Start the gateway
openclaw gateway start

# Configure your channels
openclaw configure
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw Gateway                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │WhatsApp │  │Telegram │  │ Discord │  │  Slack  │  ...  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
├─────────────────────────────────────────────────────────────┤
│                    Agent Layer                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Skills │  Extensions │  Plugins │  Providers       │  │
│  └─────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Core Services                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ Sessions│  │ Memory  │  │ Routing │  │ Security│       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Installation

### Prerequisites
- Node.js 24+
- npm or pnpm

### Install from npm
```bash
npm install -g openclaw
```

### Install from source
```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
```

## 🔧 Configuration

OpenClaw uses a simple configuration file:

```json
{
  "gateway": {
    "port": 3000,
    "host": "localhost"
  },
  "channels": {
    "telegram": {
      "token": "your-telegram-bot-token"
    },
    "discord": {
      "token": "your-discord-bot-token"
    }
  },
  "providers": {
    "openai": {
      "apiKey": "your-openai-api-key"
    }
  }
}
```

## 🛠️ Development

### Setup
```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
```

### Build
```bash
pnpm build
```

### Test
```bash
pnpm test
```

### Lint
```bash
pnpm lint
```

## 📚 Documentation

- [Getting Started](https://docs.openclaw.ai/getting-started)
- [Configuration](https://docs.openclaw.ai/configuration)
- [Channels](https://docs.openclaw.ai/channels)
- [Skills](https://docs.openclaw.ai/skills)
- [Extensions](https://docs.openclaw.ai/extensions)
- [API Reference](https://docs.openclaw.ai/api)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape OpenClaw
- Special thanks to the Discord community for feedback and support

---

<p align="center">
  Made with ❤️ by the OpenClaw team
</p>
