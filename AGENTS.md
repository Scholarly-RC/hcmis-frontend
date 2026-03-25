<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from older Next.js habits. Read relevant docs in `node_modules/next/dist/docs/` before editing and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend Agent Guide

This file defines how coding agents should work in `hcmis-frontend`.
Follow these rules before making changes.

## Scope

- Applies to everything under this frontend directory.
- Prefer safe, incremental changes over large rewrites.
- Preserve behavior unless the task explicitly requests a change.

## Stack And Runtime

- Next.js `16.x` (App Router)
- React `19.x`
- TypeScript
- Tailwind CSS `4`
- shadcn/ui
- Biome (lint/format)
- Package manager: `pnpm`

## Core Commands

- Install deps: `pnpm install`
- Run dev server: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Type check: `pnpm exec tsc --noEmit`
- Format: `pnpm format`

## Required Engineering Workflow

1. Read relevant files and route structure before editing.
2. Scan `components/ui/` and nearby shared components for an existing shadcn primitive before introducing custom UI.
3. Make the smallest change that fully satisfies the request.
4. Reuse existing UI primitives before creating new abstractions.
5. Run checks (`pnpm lint` and `pnpm exec tsc --noEmit` by default).
6. Summarize changed files, behavior impact, and any residual risks.

## Lean Ctx Tooling Preference

- Prefer `lean_ctx` MCP tools for repo exploration, reads, search, and command output analysis.
- Default command-to-tool mapping:
- `ctx_tree` for project structure inspection.
- `ctx_search` for locating symbols, strings, and usage sites.
- `ctx_read` and `ctx_multi_read` for file reading (prefer compressed modes unless full file context is required).
- `ctx_shell` for command execution when summarized output is sufficient.
- Use `ctx_cache` and `ctx_metrics` to keep iterative work token-efficient.
- Use raw shell utilities only when `lean_ctx` cannot fulfill the operation.

## Project Structure Rules

- `app/`: route segments, layouts, pages, loading/error states.
- `components/ui/`: shadcn-generated primitives. Treat as shared UI building blocks.
- `components/`: app-specific composite components.
- `hooks/`: reusable React hooks.
- `lib/`: utilities and framework-agnostic helpers.
- `types/`: shared TypeScript type definitions.
- `public/`: static assets.

## File Placement Conventions

- Route-specific UI should live near its route unless reused.
- Shared, reusable UI belongs in `components/`.
- Avoid putting business logic directly in deeply nested JSX blocks; extract local components or helper functions when readability drops.
- Keep server-only logic out of client components.

## App Router Rules

- Use `app/<segment>/page.tsx` for pages and `layout.tsx` for shared shells.
- Use route groups only when they improve organization without changing URLs.
- Keep metadata accurate in route/layout files when applicable.
- Use `next/link` for internal navigation.
- Use `next/navigation` primitives (`redirect`, etc.) in the correct server/client context.

## Server And Client Component Boundaries

- Default to Server Components.
- Add `"use client"` only when needed (state, effects, event handlers, browser-only APIs).
- Do not import server-only modules into client components.
- Keep client boundaries small and intentional.

## shadcn/ui Rules

- Prefer existing shadcn components before custom one-off UI.
- Add components with the shadcn CLI/MCP flow; avoid hand-copying registry code.
- Keep generated primitives in `components/ui/` and compose them in feature code.
- Default to shadcn primitives for interactive UI and form controls instead of raw HTML when a matching primitive exists, including dialogs, menus, tables, textareas, collapsibles, popovers, sheets, and similar building blocks.
- If the needed primitive is missing, add it through the shadcn CLI/MCP flow before building a custom alternative.
- If a shadcn component requires provider wiring (for example `TooltipProvider`), ensure it is added in `app/layout.tsx` or the appropriate shared layout.

## Styling Rules

- Use Tailwind utility classes and existing design tokens from `app/globals.css`.
- Prefer tokenized colors (`bg-background`, `text-foreground`, etc.) over hardcoded colors.
- Keep styles consistent with existing spacing, sizing, and typography scales.
- Avoid inline styles except for dynamic values that cannot be expressed cleanly with utilities.

## State, Data, And Side Effects

- Keep pages presentational unless the task needs data wiring.
- For forms, use React Hook Form + Zod for non-trivial or validated forms; keep very small forms simple only when there is no meaningful validation/state complexity.
- Prefer a consistent form pattern over ad hoc `useState` validation when a form has multiple fields, derived state, or server error handling.
- Isolate async/data-fetch logic so rendering remains easy to follow.
- Handle empty/loading/error states for non-trivial data views.

## Code Quality Expectations

- Write typed, readable code with explicit names.
- Keep modules focused and small.
- Prefer composition over deep prop drilling.
- Avoid introducing new dependencies unless clearly justified.
- Preserve backward compatibility of existing routes and expected UI behavior unless requested otherwise.

## Engineering Principles

- KISS: choose the simplest solution that fully solves the requirement.
- DRY: avoid duplicate logic and styles; extract shared pieces when repetition is real.
- YAGNI: do not add speculative abstractions, options, or features.
- SOLID (pragmatic): keep boundaries clear across UI, state, and data layers.
- Single responsibility: components/modules should have one primary reason to change.
- Explicit over implicit: make data flow, navigation, and side effects easy to trace.
- Separation of concerns: keep presentation, behavior, and data access cleanly separated.
- Consistency over novelty: follow existing project patterns before introducing new ones.

## Performance And Accessibility

- Avoid unnecessary client-side rendering.
- Keep bundle impact in mind when adding libraries/components.
- Use semantic HTML and accessible labels for form controls.
- Ensure keyboard-accessible navigation and interactive elements.

## Do Not

- Do not bypass existing App Router conventions.
- Do not place unrelated logic changes in the same edit.
- Do not silently alter route paths or navigation structure without explicit request.
- Do not hardcode secrets or environment-specific endpoints in components.
- Do not revert unrelated user changes.
- Do not run `pnpm build` for routine integration work unless explicitly requested.

## Definition Of Done

- Requested UI/behavior is implemented.
- Lint and typecheck pass (`pnpm lint` and `pnpm exec tsc --noEmit`) unless the task explicitly requires a build.
- Build status is reported only when `pnpm build` is explicitly requested or required by the task.
- Format status is reported when relevant (`pnpm format`).
- File structure and component boundaries remain clean and maintainable.
