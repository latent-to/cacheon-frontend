# Cacheon.ai Frontend

Frontend for [cacheon.ai](https://cacheon.ai) — customer inference optimization, benchmarks, and documentation for [Cacheon](https://github.com/latent-to/cacheon).

The homepage leads with inference optimization for customer workloads and benchmarks. Contributor,
validator, rewards, roadmap, and team content lives at `/subnet`.

## Benchmark content

`app/constants/benchmarks.ts` holds internal measurements and the OpenRouter model
IDs. The homepage's server loader fetches each model's official
`/api/v1/models/{author}/{slug}/endpoints` response through the Cloudflare Cache API.
It keeps each endpoint's prices and last-30-minute P50 throughput/TTFT together.
Only available endpoints (`status: 0`) are shown. Charts rank the top three with
measurements for the selected metric, including Fast tiers; the pricing table
includes all available endpoints. Missing API metrics stay null and are not ranked.
The API can return prices with no performance metrics; that state is explicit in
the UI, without reusing old hardcoded numbers or mixing measurement windows.

Cache entries are fresh for one hour per Cloudflare location. The next request
after expiry returns a visibly stale snapshot while refreshing in `waitUntil`.
Failures retain the last successful data for at most 24 hours, preserving its
original timestamp, and back off for five minutes. A cold failure displays
unavailable and is cached for five minutes. Concurrent refreshes are coalesced
within an isolate. Cold requests have a five-second upstream timeout; the three
models refresh independently. No cron, browser polling, KV binding, or database
is required. Data refreshes with traffic, not while the site is idle.

An optional `OPENROUTER_API_KEY` Worker secret is sent only to OpenRouter; it is
never returned in loader data. Set it with `npx wrangler secret put OPENROUTER_API_KEY`
if the endpoint requires authentication. Public access currently returns prices
but may omit performance measurements; authentication does not guarantee those
metrics will be available. Homepage loader responses use `Cache-Control: no-store`
so the upstream-data cache never freezes Cacheon pricing.

## Configure Cacheon pricing

Edit `vars.CACHEON_PRICING` in `wrangler.jsonc`, or supply that JSON binding in the
deployment environment. Model keys are `qwen`, `glm`, and `deepseek`. Each accepts
`input`, `output`, and `cacheRead` in **USD per million tokens**. For example,
`"qwen": { "input": 0.1, "output": 0.5, "cacheRead": 0.025 }` is illustrative,
not a published price. Null or omitted fields show **Contact us**; zero displays
as free (`$0`). Defaults remain unpublished until actual rates are supplied.
Negative/non-finite values, unknown model names, and misspelled fields fail
configuration validation rather than displaying incorrect prices. JSON objects
and JSON strings are supported. Use `.dev.vars` for local string overrides.

Prices appear above the benchmark chart and in the comparison table. There is no
public pricing editor; these are operator-controlled deployment settings.

## Internal measurement provenance

The Qwen result is backed by the six retained October 7 H100 measurements in
`public/benchmarks/qwen-h100-20261007.json`. The tuned checkpoint and o200k token
counting differ from OpenRouter. Both medians include all six prompts; this is the
fastest observed candidate of seven, not repeated stability testing. GLM's 125 and
DeepSeek's 232 tok/s/user come from the existing internally supplied performance
summary; their run protocols and TTFT are still pending and are labeled that way.
Before making matched-performance or market-leadership claims, supply runs using
the same checkpoint, token counting, prompts, reasoning settings, concurrency,
cache state, and client measurement boundary for each provider.

## Contact form delivery

The homepage form submits to a server action that sends only to **sales@cacheon.ai**
through the `SALES_EMAIL` Cloudflare email binding. Messages use
`website@cacheon.ai` as From and the visitor's validated address as Reply-To.
Name, email, optional company, and workload details are sent as plain text.
The client shows success only after the email service accepts the submission;
provider failures show a retry message. The destination email address is not
displayed on the page or included in public form responses.

Before production deployment, onboard `cacheon.ai` for
[Cloudflare Email Sending](https://developers.cloudflare.com/email-service/get-started/send-emails/)
and verify/authorize `sales@cacheon.ai` as a destination for the restricted binding.
This repository configures the binding; it does not provision or verify the domain
or mailbox. Confirm delivery in staging before launch. Do not change the existing
mailbox MX records to enable outbound sending.

Same-origin POST checks, server validation, a hidden honeypot, a 32 KiB request cap,
and `CONTACT_RATE_LIMITER` (five attempts per IP per minute per Cloudflare location)
protect the endpoint. Missing email or rate-limit bindings fail closed. Form
contents and provider error details are not logged by the application. Cloudflare
Email Service still processes the submitted details for delivery.

Local Wrangler email bindings simulate delivery. Keep remote bindings disabled
for local tests; the automated tests use a fake sender and never email the team.
`npm run test:contact` covers delivery routing, validation, rate limiting, and errors.

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
npm run test:benchmarks # pricing, API normalization, ranking, and cache behavior (Node 22.6+)
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
