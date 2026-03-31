# 🔢 Token Calculator

A lightweight, open-source web tool for counting tokens across multiple LLM tokenizers.

Paste your text and instantly see token counts for GPT-4o, GPT-3.5, Claude, and more — plus estimated API costs.

## ✨ Features

- 🔤 **Multi-model support** — GPT-4o, GPT-4, GPT-3.5-turbo, Claude 3.5, Llama 3, etc.
- ⚡ **Real-time counting** — Token count updates as you type
- 💰 **Cost estimation** — See estimated input/output costs per model
- 📊 **Text statistics** — Characters, words, lines, and token counts side by side
- 🌙 **Dark mode** — Easy on the eyes
- 📱 **Responsive** — Works on desktop and mobile
- 🚀 **Zero backend** — Pure frontend, runs entirely in your browser
- 🌐 **Bilingual** — English & Chinese UI

## 🚀 Quick Start

Just open `index.html` in your browser. No build step, no dependencies to install.

Or visit the live demo: [https://shrekzang-coder.github.io/token-calculator](https://shrekzang-coder.github.io/token-calculator)

## 📖 How It Works

Token counting uses `js-tiktoken` (WebAssembly-based) for OpenAI models. For other models, approximate token ratios are applied based on published benchmarks.

## 🏗️ Tech Stack

- Vanilla HTML/CSS/JavaScript
- [js-tiktoken](https://github.com/dqbd/tiktoken) via CDN
- No frameworks, no build tools

## 📄 License

MIT License — do whatever you want with it.

## 🤝 Contributing

Issues and PRs welcome! This is a community tool — make it better.
