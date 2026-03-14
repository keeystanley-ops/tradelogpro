# Trading Journal & Analytics SaaS

## Overview

A full-stack Trading Journal & Analytics platform — a competitor to TradeZella/Edgewonk — for retail traders. Built as a pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Recharts + wouter
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
/
├── artifacts/
│   ├── api-server/          # Express API backend (port 8080, path /api)
│   ├── trading-journal/     # React frontend (port 21194, path /)
│   └── mockup-sandbox/      # Design sandbox (not in active use)
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 spec + Orval codegen
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod schemas
│   └── db/                  # Drizzle ORM schema + DB connection
├── scripts/                 # Utility scripts
└── attached_assets/         # Original source zip + prompt files
```

## Features

### Dashboard
- Key metrics: Net P&L, Win Rate, Profit Factor, Expectancy, Max Drawdown, Sharpe Ratio
- Equity curve chart with drawdown overlay (Recharts AreaChart)
- Recent trades table
- Streak indicators

### Trade Journal
- Manual trade entry form (AddTradeModal)
- CSV import (CsvImportModal)
- Trade tagging: Setup, Mistake, Emotion tags
- Trade detail drawer (TradeDrawer)
- Sortable/filterable trades table

### Analytics
- Behavioral analytics: best/worst setups, mistake frequency
- Asset class performance breakdown
- Win/Loss heatmap by day of week + time of day
- P&L distribution chart

### Calendar View
- Monthly P&L calendar heatmap by trading day

### Playbooks
- Create and manage trading strategies/playbooks with entry/exit rules

### Goals
- Track P&L, Win Rate targets with progress bars
- Monthly/Yearly periods

### Weekly Review
- Week-by-week performance summary

### AI Features
- AI-powered trade note summarization (OpenAI integration)

## API Routes

- `GET /api/healthz` — Health check
- `GET /api/trades` — List trades (filterable)
- `POST /api/trades` — Create trade
- `PUT /api/trades/:id` — Update trade
- `DELETE /api/trades/:id` — Delete trade
- `POST /api/trades/import-csv` — CSV import
- `GET /api/analytics/dashboard` — Dashboard metrics
- `GET /api/analytics/equity-curve` — Equity curve data
- `GET /api/analytics/calendar` — Calendar heatmap
- `GET /api/analytics/behavioral` — Behavioral analytics
- `GET /api/analytics/heatmap` — Time-of-day heatmap
- `GET /api/analytics/weekly-review` — Weekly review data
- `GET /api/insights` — Behavioral insights
- `GET /api/goals` — List goals
- `POST /api/goals` — Create goal
- `GET /api/playbooks` — List playbooks
- `POST /api/playbooks` — Create playbook
- `POST /api/ai/summarize-note` — AI note summary

## Database Schema

- `trades` — Core trade records with all fields (symbol, direction, P&L, tags, notes, rating)
- `goals` — Performance goals with progress tracking
- `playbooks` — Trading strategy definitions
- `conversations` / `messages` — AI chat history

## Workflows

- `artifacts/api-server: API Server` — Express backend
- `artifacts/trading-journal: web` — Vite dev server (React frontend)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` (composite: true). Run typecheck from root:
- `pnpm run typecheck` — Full typecheck across all packages
- `pnpm --filter @workspace/db run push` — Push DB schema changes
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API client + Zod schemas
