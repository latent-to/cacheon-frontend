# Cacheon.ai Frontend

Frontend for [cacheon.ai](https://cacheon.ai) — the dashboard and docs site for [Cacheon](https://github.com/latent-to/cacheon) (Bittensor SN14).

The homepage introduces the inference product and benchmarks. Contributor,
validator, rewards, roadmap, and team content lives at `/subnet`.

## Benchmark content

`app/constants/benchmarks.ts` holds a dated editorial snapshot, not a live feed.
The comparison shows internal Cacheon measurements separately from OpenRouter's
published P50 provider metrics. It does not calculate cross-source speedup claims.
Provider rows retain their own TTFT, throughput, and prices together. Selection
includes the three highest-throughput endpoints in Standard routing (including
Fast tiers) and the lowest-TTFT endpoint when distinct.

The October 15, 2026 OpenRouter snapshot links to each original model page.
Refresh the complete provider selection, prices, metrics, and date together.
Do not substitute the fastest provider's throughput and another provider's latency
into a single row. Missing measurements stay null, never zero.

The Qwen result is backed by the six retained October 7 H100 measurements in
`public/benchmarks/qwen-h100-20261007.json`. The tuned checkpoint and o200k token
counting differ from OpenRouter. Both medians include all six prompts; this is the
fastest observed candidate of seven, not repeated stability testing. GLM's 125 and
DeepSeek's 232 tok/s/user come from the existing internally supplied performance
summary; their run protocols and TTFT are still pending and are labeled that way.
Before making matched-performance or market-leadership claims, supply runs using
the same checkpoint, token counting, prompts, reasoning settings, concurrency,
cache state, and client measurement boundary for each provider.

Access currently links to the established team Discord. Replace it with the real
onboarding destination when available; the page does not invent a public API URL,
self-service signup, or Cacheon price.

## Stack

| Layer   | Choice                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------- |
| UI      | React 19, TypeScript                                                                              |
| Routing | React Router v7                                                                                   |
| Build   | Vite                                                                                              |
| Styling | Tailwind CSS v4                                                                                   |
| Docs    | Fumadocs (generated from the [Cacheon repo](https://github.com/latent-to/cacheon/tree/main/docs)) |
| Deploy  | Cloudflare Workers (`wrangler.jsonc`)                                                             |

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

- Bittensor Discord: [# ㄷ・cacheon・14](https://discord.com/channels/799672011265015819/1503393871172866098)
- Discord: [Cacheon](https://discord.gg/RGECbrRBPv)
- X: [@cacheon_ai](https://x.com/cacheon_ai)
