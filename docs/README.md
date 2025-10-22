# 📚 FortiFlow Documentation

This directory contains all FortiFlow documentation, organized by topic.

## 📂 Structure

```
docs/
├── index.html           # GitHub Pages download page
├── setup/               # Installation and setup guides
│   └── TAURI_SETUP.md  # Complete Tauri installation guide
└── release/             # Release and distribution
    ├── RELEASE.md       # Complete release guide with troubleshooting
    └── QUICK_RELEASE.md # Quick reference for releases
```

## 🚀 Quick Links

### For Users
- **[Download Page](https://albantsrr.github.io/ftn-grind/)** - Get the latest version

### For Developers
- **[Setup Guide](setup/TAURI_SETUP.md)** - Install dependencies and run the app
- **[Troubleshooting](setup/TROUBLESHOOTING.md)** - Fix common production issues
- **[Quick Release](release/QUICK_RELEASE.md)** - Create a new release in minutes
- **[Complete Release Guide](release/RELEASE.md)** - Detailed release process with troubleshooting

### For Claude Code
- **[CLAUDE.md](../CLAUDE.md)** - Project architecture and development guide

## 🌐 GitHub Pages

The download page (`index.html`) is automatically deployed via GitHub Pages.

**URL:** `https://<your-username>.github.io/ftn-grind/`

To update for a new release, the version is automatically updated by the `scripts/prepare-release.sh` script.
