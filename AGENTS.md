# AGENTS.md

## Build & Commands

- **Dev**: `npm run dev` or `bun dev` (starts Next.js dev server on port 3000)
- **Build**: `npm run build` (production build)
- **Start**: `npm run start` (runs production server)
- **Test**: `bun test` (runs all tests with Bun)
- **Test single file**: `bun test src/__tests__/integration.test.tsx`
- **Test watch**: `bun test --watch`
- **Lint**: `npm run lint` (ESLint with next/core-web-vitals & typescript configs)
- **DB seed**: `npm run db:seed`

## Architecture & Structure

**Tech Stack**: Next.js 16 + React 19 + TypeScript + Prisma ORM + SQLite

**Directory Structure**:
- `src/app/` - Next.js App Router pages & API routes
- `src/components/` - React components (UI library + feature components)
- `src/components/ui/` - Shadcn-based UI primitives
- `src/lib/` - Utilities: date-utils, natural-language-parser, smart-scheduling, prisma client
- `src/__tests__/` - Test setup, utils, and integration tests
- `prisma/` - Database schema and migrations (SQLite with better-sqlite3 adapter)

**Database Models**: List, Task, Subtask, Reminder, Attachment, Label, TaskLabel, ChangeLog

## Code Style & Conventions

**Imports**: Use path alias `@/` (configured in tsconfig.json). Order: React, dependencies, internal utils, types
**Components**: Use `"use client"` directive. Export named exports. Functional components with hooks
**Types**: Define component props as `interface ComponentProps`. Use `type` for unions/unions/primitives
**Files**: kebab-case for .tsx/.ts files. UI components in `ui/` subdirectory
**Styling**: Tailwind CSS with `cn()` utility (clsx + twMerge). Use Radix UI primitives
**Testing**: Bun test runner with Testing Library. Test files colocated in `__tests__/` subdirectories
**Error handling**: Try-catch blocks; display errors in UI with AlertCircle icon and error messages
**Naming**: camelCase for functions/variables. Use prefixes: `handle*` for handlers, `on*` for props
