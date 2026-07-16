# Lumina — Project Instructions

## Language
- Respond to the user in Uzbek (the user writes in Uzbek). Code, comments, and commit messages stay in English.

## Stack (do not drift)
- Bare React Native CLI 0.79.x + React 19 — **NO Expo packages** (fully migrated away; never reintroduce `expo-*` deps).
- React Navigation v7 (typed param lists in `src/navigation/types.ts`).
- Strict TypeScript — `any` is forbidden; `npm run typecheck` must stay at 0 errors.
- TanStack Query (server state) + Zustand (client state); RHF + Zod for forms.
- Design-system tokens only — no raw hex/fontSize in screens or features.

## Verification loop (after every stage of work)
1. `npm run typecheck` → must be 0 errors.
2. `npm run lint` → must exit 0.
3. For navigation/toolchain changes also verify Metro resolves:
   `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/bundle-test.js`

## Git workflow
- Commit after each completed stage with a descriptive message; push with retry/backoff (2s/4s/8s/16s on network failure).
- Never push to `main` directly; work on the designated feature branch and open PRs when asked.

## Agent delegation
Specialized agents live in `.claude/agents/` (committed to the repo so they survive ephemeral containers). Route work via the Task tool:

| Task pattern | Agent | Model |
|---|---|---|
| Architecture, navigation flow, migration plans | `rn-architect` | opus |
| Screens & components (Reanimated/Gesture) | `rn-screen-builder` | sonnet |
| Services, query hooks, optimistic updates, storage | `rn-data-layer` | sonnet |
| Theme tokens, primitives, skeletons/empty/error states | `rn-design-system` | sonnet |
| Domain types, Zod schemas, navigation params | `rn-types-author` | sonnet |
| Mechanical scaffolding, configs, bulk find-replace | `rn-scaffolder` | haiku |
| Module audits (no-any, re-renders, leaks) | `rn-code-reviewer` | sonnet |

- Delegate matching tasks; execute directly only what no agent covers (orchestration, git, quick lookups).
- **This routing table applies ONLY to the main orchestrator session.** If you are a subagent executing an assigned task, do the work yourself with Read/Write/Edit/Bash — NEVER spawn another agent.
- Overlap note: use the built-in `/code-review` skill for PR/diff reviews; use `rn-code-reviewer` for deep module audits.
- If agents fail on session limits, finish critical-path work directly rather than blocking.
