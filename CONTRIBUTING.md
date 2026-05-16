# Contributing to cacheon-frontend

Thanks for your interest in contributing to the Cacheon Frontend ([cacheon.ai](https://cacheon.ai)).

## Getting started

```bash
git clone https://github.com/latent-to/cacheon-frontend.git
cd cacheon-frontend
npm install
npm run dev        # http://localhost:5173
```

Node 20+ is required.

## Stack

| Layer   | Choice                                |
| ------- | ------------------------------------- |
| UI      | React 19, TypeScript                  |
| Build   | Vite + React Router v7                |
| Styling | Tailwind CSS v4                       |
| Docs    | Fumadocs (MDX under `content/docs/`)  |
| Deploy  | Cloudflare Workers (`wrangler.jsonc`) |

## Project layout

```
app/              React Router routes, layouts, and components
content/docs/     Fumadocs MDX -- canonical docs source
public/           Static assets (team photos, icons)
workers/          Cloudflare Worker entry points
workflows/        Cloudflare Workflows
```

## Before you open a PR

1. **Lint and format.**

   ```bash
   npm run lint
   npm run format:check
   ```

2. **Type-check.**

   ```bash
   npm run typecheck
   ```

3. **Preview a production build locally** if your change touches routing, the Worker, or Workflows.

   ```bash
   npm run preview
   ```

## Docs changes (`content/docs/`)

Docs are written in MDX and served via Fumadocs. A few rules:

- Sidebar order comes from `meta.json` files in each directory. Update them when you add or rename pages.
- Avoid JSX-hostile characters in prose: wrap comparison operators like `<=` or `<` in backtick spans (`` `<= 0.5` ``) rather than leaving them bare.
- Keep miner-facing content under `content/docs/miners/` and validator-facing content under `content/docs/validators/` or `content/docs/evaluation/`. Do not duplicate facts across files; link to the canonical section instead.

## Style guide

- Dark background, white text. Electric teal (`#9EFFE3` / `#A7EF9E`) as a small accent only.
- `Inter` for body/UI copy, display font for hero titles only.
- All new components should be Tailwind-first and responsive via breakpoints, not parallel mobile sections.
- Avoid AI-flavored or crypto-forward copy when writing for a general technical reader.

## Commit messages

Use the conventional commits format:

```
feat: add miner leaderboard hover state
fix: correct sidebar order for validators section
docs: update scoring page with new KL formula
```

## Pull requests

- Keep PRs small and focused. One logical change per PR.
- PRs against `main` require at least one review (enforced by branch rules).
- Include a short description of what changed and why.
- Reference any related issue or discussion thread.

## Questions

Open a discussion on GitHub or reach out on the [Bittensor Discord](https://discord.gg/bittensor) in the Cacheon channel.
