# Development Environment

Project development environment and toolchain.

## Package Management: Bun

**All commands must go through bun. Do not use npm/yarn/pnpm.**

```bash
# Install all dependencies
bun install

# Add packages
bun add <package>
bun add -D <package>    # Dev dependency

# Add to specific workspace
bun add <package> --filter <workspace>

# Run scripts
bun run <script>
```

### Monorepo Structure

```
ribon/
├── apps/
│   ├── core/       # @repo/core — BFF API (Next.js + Hono + Drizzle)
│   └── ribon/      # @repo/ribon — BFF + Frontend (Next.js + Hono + Tailwind)
├── packages/
│   ├── ui/         # @repo/ui — Shared UI components
│   ├── auth/       # @repo/auth — Supabase Auth
│   ├── eslint-config/       # @repo/eslint-config — Shared ESLint config
│   └── typescript-config/   # @repo/typescript-config — Shared TS config
├── package.json    # Root (workspaces: apps/*, packages/*)
└── turbo.json      # Turborepo task definitions
```

## Task Runner: Turborepo

All tasks are run via Turborepo from the project root:

```bash
# Development server (all apps)
bun run dev

# Build
bun run build

# Lint
bun run lint

# Type check
bun run check-types

# Format
bun run format
```

### turbo.json Task Configuration

| Task | Dependencies | Cache | Notes |
|------|-------------|-------|-------|
| `build` | `^build` | Yes | Reads `.env*`, outputs `.next/**` |
| `dev` | — | No | Persistent (long-running) |
| `lint` | `^lint` | Yes | |
| `check-types` | `^check-types` | Yes | |

## Linting: ESLint 9

ESLint 9 flat config with shared presets in `@repo/eslint-config`:

| Preset | Used by | Base |
|--------|---------|------|
| `base.js` | All packages | `@eslint/js` + `typescript-eslint` + `eslint-config-prettier` |
| `next-js` | `apps/core`, `apps/ribon` | base + `@next/eslint-plugin-next` + React plugins |
| `react-internal` | `packages/ui` | base + React plugins |

```bash
# Run lint (via Turbo)
bun run lint
```

## Formatting: Prettier

Prettier with default settings (no config file).

```bash
# Format all files
bun run format
# → prettier --write "**/*.{ts,tsx,md}"
```

`eslint-config-prettier` is integrated into ESLint to disable conflicting rules.

## Type Checking: TypeScript

TypeScript 5.9.2 with shared presets in `@repo/typescript-config`:

| Preset | Used by | Key settings |
|--------|---------|-------------|
| `base.json` | Foundation | ES2022, strict, NodeNext |
| `nextjs.json` | `apps/core`, `apps/ribon` | ESNext module, Bundler resolution, jsx preserve |
| `react-library.json` | `packages/ui`, `packages/auth` | jsx react-jsx |

```bash
# Type check (via Turbo)
bun run check-types
```

## Database: Drizzle ORM

PostgreSQL + Drizzle ORM + Drizzle Kit (in `apps/core`).

```bash
# Generate migration from schema changes
cd apps/core
bun run db:generate --name <migration_name>

# Apply migrations
bun run db:migrate

# Drop migration
bun run db:drop

# Reset (drop + migrate)
bun run db:reset
```

| Item | Path |
|------|------|
| Drizzle config | `apps/core/drizzle.config.ts` |
| Schemas | `apps/core/db/schemas/*.ts` |
| Migrations | `apps/core/db/migrations/` |
| DB client | `apps/core/db/client/` |

Migration naming rules are in `.claude/rules/database-schema.md`.

## Environment Variables

When adding or removing environment variables in `.env.local` or `.env`, update the Turborepo cache key in `turbo.json`.

**Why**: Without this, Turborepo may use stale cached builds even after env var changes.

**Steps**:
1. Add/remove the env var in `.env.local` or `.env`
2. Update the corresponding task's `env` array in `turbo.json`

```json
{
  "tasks": {
    "@repo/core#build": {
      "env": ["POSTGRES_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_KEY"]
    }
  }
}
```

## Common Commands

```bash
# Install dependencies
bun install

# Development
bun run dev

# Quality check
bun run lint && bun run check-types

# Build
bun run build

# Format
bun run format

# Database (from apps/core)
cd apps/core
bun run db:generate --name <name>
bun run db:migrate
```

## Pre-commit Checklist

- [ ] `bun run lint` passes
- [ ] `bun run check-types` passes
- [ ] `bun run build` passes
