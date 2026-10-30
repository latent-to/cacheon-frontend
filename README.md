# Cacheon.ai Frontend

Frontend for [cacheon.ai](https://cacheon.ai) — customer inference optimization, benchmarks, and documentation for [Cacheon](https://github.com/latent-to/cacheon).

The homepage (`app/routes/home.tsx`) serves customers with two paths: Cacheon-hosted
inference and optimization of a team's own serving stack. Its sections live in
`app/components/customer/` and use the shared `Nav`, `Footer`, and Tailwind theme
tokens. Contributor, validator, rewards, roadmap, and team content lives at `/subnet`.

## Benchmark content

`app/constants/customer-results.ts` holds the internal results shown on the homepage
(`customerModels`) and dated OpenRouter provider snapshots (`providerSnapshots`).
`customerModels` is also the single source of OpenRouter model IDs for live requests; display names never determine API slugs. The homepage's server
loader (`getModelComparisons` in `app/lib/model-comparisons.server.ts`) fetches each
model's official `/api/v1/models/{author}/{slug}/endpoints` response through the
Cloudflare Cache API. It keeps each endpoint's last-30-minute P50 throughput/TTFT
together and caches input, output, and cached-input API prices as USD per million
tokens. OpenRouter's latency percentiles are milliseconds; the adapter converts them
to seconds. Only available endpoints (`status: 0`) are shown. Missing metrics stay
null and are not ranked.

`resolveMarket` (`app/lib/provider-market.ts`) selects the available endpoint with
the highest measured output speed for each model, including Fast tiers, and keeps
that endpoint's prices together. A collapsed table lists every measured endpoint.
The page revalidates its loader every five minutes while the tab is visible.
`GET /api/comparisons` returns the same `{ comparisons }` payload as same-origin JSON.
No credentials or customer data are returned.

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

## Measurement sources

The October 30, 2026 refresh reconciles the public dashboard winners with each
submission's final decision and the read-only validator database. Retained
qualification artifact hashes and runtime identities were verified. The public,
sanitized compilation is [arena-results-20261030.json](public/benchmarks/arena-results-20261030.json).
It keeps baseline/candidate timing, load, hardware, checkpoint, artifact identity,
qualification score, and final status together. Qualification score is a
fixed-work-rate metric, not the ratio of displayed decode speeds. A PASS or crown
does not establish production integration.

| Customer result     |  Decode tok/s/user |           TTFT (s) | Hardware          | Workload / date                         | OpenRouter ID                  |
| ------------------- | -----------------: | -----------------: | ----------------- | --------------------------------------- | ------------------------------ |
| DeepSeek V4.1 Flash | 434.06736713754543 |  2.597567250050037 | 2 × B300 per lane | 24 sessions, warm-turn means, Oct 19    | `deepseek/deepseek-v4.1-flash` |
| GLM-5.3 streaming   |  297.0138688177521 | 0.7153227505004907 | 4 × B300          | Single user, six-prompt medians, Oct 16 | `z-ai/glm-5.3`                 |
| Muse Spark Open     |  199.2529406496159 | 1.8979672124784053 | 4 × B300 per lane | 16 sessions, warm-turn means, Oct 25    | `meta/muse-spark-open`         |

DeepSeek uses the original September model's NVIDIA NVFP4 derivative, not the
October 17 model. The active 1017 PD arena has no accepted winner at this snapshot:
a retained crown was superseded by a final FAIL after regrade. Its result must not
replace the legacy result or use the original model's provider prices. The
October 19 DeepSeek result is an audited PASS in the public winners list; its
durable settlement is held, so the site does not describe it as a new crown.
Newer Muse/legacy DeepSeek PASS rows that lost eligibility are excluded.

GLM's headline remains the usable single-user point for run `02-d5be4989` in
[the October 16 streaming sweep](public/benchmarks/glm-concurrency-20261016.json).
Measurement details separately show its latest arena crown from October 10:
125.0439568665574 tok/s/user, 2.9131185586534216 s mean TTFT, 24 sessions.
Those workloads and winning bundles are not combined. Qwen3.8's latest result
is retained in the compilation but omitted from customer-facing comparisons.
Its `qwen/qwen3.8-27b` mapping remains distinct from Qwen3.6 27B and the older tuned
Qwen3.6 35B A3B H100 benchmark.

`app/constants/provider-snapshots.ts` supplies all available endpoint rows from
the authenticated OpenRouter API captured **October 30, 2026 at 15:00 UTC**.
The credential-free source is [openrouter-20261030.json](public/benchmarks/openrouter-20261030.json).
The same `parseEndpoints` normalizer used by live requests generated these rows:
P50 throughput and TTFT stay with that endpoint's prices; milliseconds become
seconds, USD/token becomes USD/million, and unavailable endpoints are excluded.
All measured providers, including faster competitors, remain eligible for ranking.
A model uses live measurements when available and otherwise shows the dated
snapshot. These are separate provider traffic measurements, not a controlled
comparison with Cacheon's workloads or quantized checkpoints.

The GPU cost-estimator libraries (`app/lib/concurrency.ts`, `cost-estimate.ts`,
`gpu-market*.ts`) are no longer rendered; they remain only because
`tests/benchmarks.test.mjs` still covers them.

## Internal measurement provenance

The earlier AIPerf results below remain in `app/constants/benchmarks.ts` and
`public/benchmarks/` but are no longer displayed on the homepage.

The Qwen result is backed by the six retained October 7 H100 measurements in
`public/benchmarks/qwen-h100-20261007.json`. The tuned checkpoint and o200k token
counting differ from OpenRouter. Both medians include all six prompts; this is the
fastest observed candidate of seven, not repeated stability testing. GLM uses paired candidate throughput and mean TTFT from its retained winning submission:
125.04 tok/s/user and 2.913 s TTFT. DeepSeek uses the newer baseline arm in submission
`840a00d2`: 338.68 tok/s/user and 3.576 s TTFT. That submission's candidate failed the
speed threshold; the displayed metrics are the baseline, not a winning candidate.
Source links and selected raw results are archived in `public/benchmarks/*-arena-20261015.json`.
Both are AIPerf replay measurements. GLM's separate single-prompt result (208.1 tok/s,
1.018 s TTFT) is a different workload and is not combined with arena metrics.
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
