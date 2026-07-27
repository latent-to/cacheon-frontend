# Cacheon.ai Frontend

Frontend for [cacheon.ai](https://cacheon.ai) — the dashboard and docs site for [Cacheon](https://github.com/latent-to/cacheon) (Bittensor SN14).

## Stack

| Layer   | Choice                                |
| ------- | ------------------------------------- |
| UI      | React 19, TypeScript                  |
| Routing | React Router v7                       |
| Build   | Vite                                  |
| Styling | Tailwind CSS v4                       |
| Docs| Fumadocs (generated from the [Cacheon repo](https://github.com/latent-to/cacheon/tree/main/docs)|
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
  docs/             Generated Fumadocs MDX (gitignored)
public/             Static assets (team photos, icons)
scripts/
  cacheon-docs.mjs  Build-time canonical docs adapter
workers/            Cloudflare Worker entry points
```

## Documentation source

Documentation prose and navigation are canonical in
[`latent-to/cacheon`](https://github.com/latent-to/cacheon): published pages come
from that repository's `mkdocs.yml` navigation and `docs/` tree. This frontend
imports an exact Cacheon commit into the gitignored `content/docs/` build
directory and generates `public/sitemap.xml` from the same ordered inventory;
do not edit or commit either generated artifact here.

By default, development and production builds resolve the current
`latent-to/cacheon` `main` commit through GitHub. To build against a clean local
checkout:

```bash
CACHEON_DOCS_SOURCE_DIR=../cacheon npm run build
```

Pin a remote build explicitly with `CACHEON_DOCS_REF=<40-character-sha>`.
`CACHEON_DOCS_REPOSITORY` can override the public `owner/repository` source.
`GITHUB_TOKEN` is optional and only used while resolving a non-SHA ref.

```bash
npm run docs:import     # regenerate content/docs without building
npm run test:docs       # adapter and compatibility-redirect tests
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, style guide, and PR guidelines. Issues and contributions are welcome.

## Community

- Discord: [# ㄷ・cacheon・14](https://discord.com/channels/799672011265015819/1503393871172866098) ([Cacheon](https://discord.com/invite/cacheon) server)
- X: [@cacheon_ai](https://x.com/cacheon_ai)
