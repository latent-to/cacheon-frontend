# Cacheon — frontend

Frontend (cacheon.ai) for **Cacheon** (Bittensor subnet SN14)

## Stack

| Layer      | Choice                                                                            |
| ---------- | --------------------------------------------------------------------------------- |
| UI         | React 19, TypeScript                                                              |
| Build      | Vite 8                                                                            |
| Styling    | Tailwind CSS v4 (`@import "tailwindcss"` in `src/index.css`)                      |
| Background | [ogl](https://github.com/oframe/ogl) — `FaultyTerminal` shader (react-bits style) |

Theme tokens live in `app/app.css`.

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build → dist/
npm run preview  # serve production build locally
npm run lint
```

## Project layout

```
frontend/
├── public/
│   ├── team/           # Team headshots (referenced from src/constants/team.ts)
│   └── icons.svg
├── src/
│   ├── components/     # Nav, Hero, WhatIs, HowItWorks, Roadmap, Team, Community, Footer, FaultyTerminal, …
│   ├── constants/      # team.ts, roadmap.ts
│   ├── diagrams/       # SVG/React diagrams (e.g. ValidatorDiagram)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css       # Tailwind + CSS variables (accent, surfaces, fonts)
├── index.html
├── vite.config.ts
└── package.json
```

## Notes

- The hero background uses a canvas; mouse movement is tracked at the window level so overlays do not block the effect.
