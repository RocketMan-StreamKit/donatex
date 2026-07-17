# Donatex

Donatex integration addon for StreamKit+. Receives real-time donation alerts via SignalR.

- **Addon id:** `donatex`
- **Type:** `platform.donation`
- **Minimum StreamKit+:** `1.0.37`

## Setup

1. Go to [donatex.gg/streamer/settings](https://donatex.gg/streamer/settings) and copy your **API key**.
2. Install this addon in **StreamKit+ → Settings → Addons**.
3. Approve the requested permissions.
4. Paste the API key in the addon settings.
5. The addon connects automatically. Donations appear in the dashboard in real time.

## Development

```bash
npm install
npm run build
```

Install the `dist/` folder in StreamKit+.

## Release

Push to the `main` branch or run the **Release addon** GitHub Action manually.

Docs: [StreamKit+ addon developer docs](https://rocketman-streamkit.github.io/types/)
