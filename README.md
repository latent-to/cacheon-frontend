# Cacheon.ai Frontend

Frontend for [cacheon.ai](https://cacheon.ai) — customer inference optimization, benchmarks, and documentation for [Cacheon](https://github.com/latent-to/cacheon).

The homepage leads with inference optimization for customer workloads and benchmarks. Contributor,
validator, rewards, roadmap, and team content lives at `/subnet`.

## Benchmark content

`app/constants/benchmarks.ts` holds internal measurements and the OpenRouter model
IDs. The homepage's server loader fetches each model's official
`/api/v1/models/{author}/{slug}/endpoints` response through the Cloudflare Cache API.
It keeps each endpoint's last-30-minute P50 throughput/TTFT together and discards
pricing before caching or sending data to the browser. OpenRouter's latency
percentiles are milliseconds; the adapter converts them to seconds.
Only available endpoints (`status: 0`) are shown. The comparison ranks the top three by
output speed, with TTFT shown alongside each speed, including Fast tiers; an expanded table
shows all available provider performance stats. Missing metrics stay null and
are not ranked. Models appear as GLM, DeepSeek, then Qwen, with GLM selected first.
No Cacheon or provider pricing is shown or included in homepage loader data.

Cache entries are fresh for one hour per Cloudflare location. The next request
after expiry returns a visibly stale snapshot while refreshing in `waitUntil`.
Failures retain the last successful data for at most 24 hours, preserving its
original timestamp, and back off for five minutes. A cold failure displays
unavailable and is cached for five minutes. Concurrent refreshes are coalesced
within an isolate. Cold requests have a five-second upstream timeout; the three
models refresh independently. No cron, browser polling, KV binding, or database
is required. Data refreshes with traffic, not while the site is idle.

Set the server-only `OPENROUTER_API_KEY` Worker secret with
`npx wrangler secret put OPENROUTER_API_KEY`. For local previews, set it in the
ignored `.env` file. Restart the preview after editing it; a `.dev.vars` file
takes precedence over `.env` in Wrangler. Authenticated endpoint requests return performance
percentiles; unauthenticated responses currently omit them. Keys never reach
loader data or the client bundle. Missing provider measurements remain unavailable.
Authenticated and public snapshots use separate cache keys so adding a key does
not reuse an empty public snapshot. Versioned cache keys also invalidate data
normalized with older units. Homepage responses use `Cache-Control: no-store`.

## Internal measurement provenance

The Qwen result is backed by the six retained October 7 H100 measurements in
`public/benchmarks/qwen-h100-20261007.json`. The tuned checkpoint and o200k token
counting differ from OpenRouter. Both medians include all six prompts; this is the
fastest observed candidate of seven, not repeated stability testing. GLM's 125 and
DeepSeek's 232 tok/s/user come from the existing internally supplied performance
summary and use AIPerf, as confirmed by the team. Their TTFT measurements remain
unpublished.
Before making matched-performance or market-leadership claims, supply runs using
the same checkpoint, token counting, prompts, reasoning settings, concurrency,
cache state, and client measurement boundary for each provider.

## Contact form delivery

The homepage form sends inquiries to a configured Discord channel using a bot,
through a server action. Name, reply email, optional company, and the full workload
message are included in one Discord message. Mentions are disabled. The website
shows success only after Discord returns a message receipt, and a generic retry
message on failure. No destination email, channel ID, or bot token is exposed in
page content, loader data, or form responses. There is no email fallback.

Before deployment, choose a private sales channel and a bot that has View Channel,
Send Messages, and Embed Links permissions there. Set both values as Worker secrets
using the interactive prompts (do not commit tokens or put them in public vars):

```bash
npx wrangler secret put CONTACT_DISCORD_BOT_TOKEN
npx wrangler secret put CONTACT_DISCORD_CHANNEL_ID
```

This change does not create a bot or select a channel. Until these are configured,
submissions fail with the retry message. Confirm delivery to the intended channel
before launch. Discord receives the submitted customer details; restrict channel
membership to the team handling inquiries.

Same-origin POST checks, server validation, a hidden honeypot, a 32 KiB request cap,
and `CONTACT_RATE_LIMITER` (five attempts per IP per minute per Cloudflare location)
protect the endpoint. Missing configuration fails closed. Provider errors and
contact details are not logged by the application. Discord requests time out after
eight seconds and are not automatically retried to avoid duplicate deliveries.
A manual retry after an ambiguous timeout can still produce a duplicate.

`npm run test:contact` uses mocked HTTP delivery and never posts to Discord.
Local development with real Discord secrets **does send real messages**. Leave
those secrets unset during routine preview checks.

Discord API reference: [Create Message](https://docs.discord.com/developers/resources/message#create-message).

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
npm run test:benchmarks # API normalization, ranking, and cache behavior (Node 22.6+)
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
