# Cacheon.ai Frontend

Frontend for [cacheon.ai](https://cacheon.ai) — the dashboard and docs site for [Cacheon](https://github.com/latent-to/cacheon) (Bittensor SN14).

## Stack

| Layer   | Choice                                |
| ------- | ------------------------------------- |
| UI      | React 19, TypeScript                  |
| Routing | React Router v7                       |
| Build   | Vite                                  |
| Styling | Tailwind CSS v4                       |
| Docs    | Fumadocs (MDX under `content/docs/`)  |
| Deploy  | Cloudflare Workers (`wrangler.jsonc`) |

## Getting started

Node 20+ required.

```bash
git clone https://github.com/latent-to/cacheon-frontend.git
cd cacheon-frontend
npm install
npm run dev        # http://localhost:5173
```

## Scripts

```bash
npm run dev            # dev server
npm run build          # production build
npm run preview        # build + wrangler dev (local Worker)
npm run deploy         # build + wrangler deploy
npm run typecheck      # full type check (fumadocs-mdx + react-router typegen + tsc)
npm run lint
npm run format:check
```

## Project layout

```
app/
  routes/           React Router routes (home, dashboard/*, docs)
  components/       Shared UI components and dashboard sections
  constants/        Static data (team, roadmap)
  diagrams/         SVG/React diagrams
  app.css           Tailwind + CSS variables (colors, fonts)
content/
  docs/             Fumadocs MDX -- canonical docs source
public/             Static assets (team photos, icons)
workers/            Cloudflare Worker entry points
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, style guide, and PR guidelines. Issues and contributions are welcome.

## Community

- Discord: [# ㄷ・cacheon・14](https://discord.com/channels/799672011265015819/1503393871172866098) ([Cacheon](https://discord.com/invite/cacheon) server)
- X: [@cacheon_ai](https://x.com/cacheon_ai)
