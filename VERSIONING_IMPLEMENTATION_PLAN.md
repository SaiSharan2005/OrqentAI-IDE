# Versioning Implementation Plan — Rules / Agents / Workflows

**Version:** 4 · **Updated:** 2026-04-27

## Goal
Make the VS Code extension honor the per-project version selection for agents, rules, and workflows, and persist the active version into the on-disk YAML frontmatter for verifiability.

---

## Decisions Locked Before Coding (per plan-eval feedback)

These three were left ambiguous in v1 of this plan; they are now resolved. Confirm with the backend team in one sync before any PR opens.

### D1 — API shape: embed `selectedVersion` in existing list responses (no fan-out)
The backend will modify the existing list endpoints to include the version directly per item:

```
GET /kilo/project/{id}/agents
→ [{ "name": "...", "version": "1.4.0", "systemPrompt": ..., ... }, ...]
```

The version returned is the version *selected for this project*, resolved server-side. The extension makes **one HTTP call per resource type** — same as today.

A separate `getProjectConfigVersions` endpoint is **dropped**. The optional `?version=` query param on the GETs is **dropped** (not needed if the list response already returns the right version).

Rationale: avoids N×3 fan-out, keeps the round-trip count identical to today, and gives the backend a single place to apply selection logic.

### D2 — Frontmatter `version` value: always concrete, never `"latest"`
Backend must always return a **resolved concrete version string** (e.g. `"1.4.0"`) in every list response — never `"latest"`, never null. When no version is pinned for an item, the backend resolves "latest" server-side and returns the actual version number.

The writers therefore unconditionally emit `version: "X.Y.Z"`. No `if (agent.version)` guard. This makes frontmatter verifiability airtight.

### D3 — Cache invalidation (dashboard refresh trigger): deferred to follow-up
Step 7 (webview message handler for live refresh from dashboard) is **removed from this plan**. Open as a follow-up ticket once the dashboard team commits to emitting the event.

For v1, the only refresh path is **manual project re-select** in the extension. Document this in the changelog and the dashboard's "version changed" UI (e.g. toast: "Re-select the project in VS Code to apply the new version").

---

## Architecture Summary (current state, confirmed)

- **HTTP client:** `packages/kilo-vscode/src/services/cli-backend/http-client.ts` — three GETs at lines 48–70.
- **Types:** `packages/kilo-vscode/src/services/cli-backend/types.ts` — `ProjectAgent` (line 221), `ProjectRule` (line 240), `ProjectWorkflow` (line 281). No `version` field.
- **Orchestrator:** `packages/kilo-vscode/src/KiloProvider.ts` `handleSelectProject` (lines 2438–2482). Single `Promise.all` fetch.
- **Writers:** `services/cli-backend/{agents,rules,workflows}-project-config.ts`. All use YAML frontmatter between `---` fences. **Verified:** all three writers wipe target files/directories before writing (agents/rules use `fs.unlinkSync`; workflows use `fs.rmSync` — recursive). Stale pre-version files get clean overwrites on the next project select. No migration needed.
- **Backend:** No governance/project-config service code in this monorepo. Backend changes (per D1, D2) are a hard prerequisite.
- **Test framework:** Bun's built-in test runner (Vitest-compatible API) for unit tests under `packages/kilo-vscode/tests/unit/` (run via `bun test:unit`). Co-located `__tests__/*.test.ts` pattern is also used. Integration tests use `vscode-test` (Mocha).

---

## Prerequisite (BLOCKER) — Backend Contract

Per D1 and D2 above, the backend must:

1. Modify the three list endpoints (`/kilo/project/{id}/{agents,rules,workflows}`) to include a `version` field per item, populated with the **selected version for this project, resolved server-side**.
2. Never return `"latest"` or null in the `version` field — always a concrete version string.
3. If the user has no version pinned for an item, resolve to the latest version server-side and return that concrete version.

If the backend cannot do (1) and (2), the work cannot ship.

---

## Implementation Steps

### Step 1 — Extend types with `version`
**File:** `packages/kilo-vscode/src/services/cli-backend/types.ts`

Add `version: string` (required, not optional — per D2) to:
- `ProjectAgent` (line 221)
- `ProjectRule` (line 240)
- `ProjectWorkflow` (line 281)

**Why:** every downstream layer needs to compile with the new field.
**Hard precondition:** backend has shipped D1 + D2 to the staging gateway and frontend dev can hit it. Do NOT land Step 1 before that — required `version: string` against an unshipped backend will write `version: "undefined"` to frontmatter on first run. If backend is delayed, fall back to `version?: string` (optional) and skip the writer steps until tightening in a follow-up PR. **If the fallback ships, file a follow-up ticket to tighten `version` to required once backend goes live.**

---

### Step 2 — No HTTP client changes needed
**File:** `packages/kilo-vscode/src/services/cli-backend/http-client.ts`

Per D1, the existing `getProjectAgents`, `getProjectRules`, `getProjectWorkflows` signatures stay the same. The backend now embeds `version` in the response body, so the client just deserializes the new field automatically (matched by the updated types in Step 1).

**Action:** verify the response parsing doesn't strip unknown fields. (Spot-check during implementation.)

---

### Step 3 — Update `handleSelectProject` to surface fetch errors per resource
**File:** `packages/kilo-vscode/src/KiloProvider.ts` (lines 2438–2482)

The existing `Promise.all` (line 2451) stays — same call shape — but switch the wrapping `try/catch` (around 2469–2477) to `Promise.allSettled` so one failed fetch doesn't blank the whole `.kilocode/` directory:

```ts
const results = await Promise.allSettled([
  client.getProjectMcpConfig(projectPublicId, platform),
  client.getProjectAgents(projectPublicId),
  client.getProjectRules(projectPublicId),
  client.getProjectWorkflows(projectPublicId),
])

const [serversResult, agentsResult, rulesResult, workflowsResult] = results

if (serversResult.status === "rejected") console.warn("[Kilo] MCP fetch failed:", serversResult.reason)
if (agentsResult.status === "rejected") console.warn("[Kilo] Agents fetch failed:", agentsResult.reason)
if (rulesResult.status === "rejected") console.warn("[Kilo] Rules fetch failed:", rulesResult.reason)
if (workflowsResult.status === "rejected") console.warn("[Kilo] Workflows fetch failed:", workflowsResult.reason)

const servers = serversResult.status === "fulfilled" ? serversResult.value : []
const agents = agentsResult.status === "fulfilled" ? agentsResult.value : []
const rules = rulesResult.status === "fulfilled" ? rulesResult.value : []
const workflows = workflowsResult.status === "fulfilled" ? workflowsResult.value : []
```

Apply only the resources that succeeded.

**Why:** isolation — a deleted/typo'd version on one rule shouldn't blank the whole `.kilocode/` directory.
**Depends on:** Step 1.

---

### Step 4 — Persist `version` to YAML frontmatter (agents)
**File:** `packages/kilo-vscode/src/services/cli-backend/agents-project-config.ts`

At the top of `buildFrontmatter` (around line 26), add a runtime guard before any other lines, then emit the version line after `name` and before `source`:

```ts
// Runtime guard — fails loud if backend regresses on D2
if (!agent.version || agent.version === "latest") {
  throw new Error(`[Kilo] non-concrete version for agent "${agent.name}": ${agent.version}`)
}
// ...existing name line...
lines.push(`version: "${agent.version}"`)
```

**Why guard:** D2 says backend always returns concrete versions. The guard fails loud if that contract is ever violated, instead of silently writing `version: "undefined"` or `version: "latest"` to disk.

---

### Step 5 — Persist `version` to YAML frontmatter (rules)
**File:** `packages/kilo-vscode/src/services/cli-backend/rules-project-config.ts`

Same pattern as Step 4 — guard at top of the frontmatter builder, then emit:
```ts
if (!rule.version || rule.version === "latest") {
  throw new Error(`[Kilo] non-concrete version for rule "${rule.name}": ${rule.version}`)
}
// ...existing name line...
lines.push(`version: "${rule.version}"`)
```

---

### Step 6 — Persist `version` to YAML frontmatter (workflows)
**File:** `packages/kilo-vscode/src/services/cli-backend/workflows-project-config.ts`

Same pattern in `buildWorkflowMarkdown` (around lines 30–35):
```ts
if (!workflow.version || workflow.version === "latest") {
  throw new Error(`[Kilo] non-concrete version for workflow "${workflow.name}": ${workflow.version}`)
}
// ...existing name line...
lines.push(`version: "${workflow.version}"`)
```

Note: combined with Step 3's `Promise.allSettled`, a single bad-version throw will surface as a rejected promise for that resource type only — the other resources still write successfully.

---

### Step 7 — Tests
Test framework: **Bun's test runner** (Vitest-compatible API) for unit tests in `packages/kilo-vscode/tests/unit/`, run via `bun test:unit`. Co-located `__tests__/*.test.ts` is also acceptable.

- **Unit (writers):** `buildFrontmatter` / `buildWorkflowMarkdown` always emit `version: "X.Y.Z"` from the input item; throw when version is missing or `"latest"`.
- **Unit (types):** TypeScript compile check that responses missing `version` are rejected (covered automatically by `tsc --noEmit` if Step 1's type is required).
- **Integration (mock fetch):** `handleSelectProject` calls each GET once, applies only fulfilled results, logs warnings on rejected ones.

---

## Deferred to Follow-Ups (Not in This Plan)

| Item | Why deferred | Owner / Trigger |
|---|---|---|
| Live refresh from dashboard (`refreshProjectConfigs` webview message) | No dashboard-side trigger committed yet — would ship as a UX cliff | Dashboard team commits to emitting the event |
| MCP versioning | Open Q #8 in v1 — needs PM signoff | Confirm with PM whether MCP servers also need versioning; if yes, mirror Steps 1–6 for `getProjectMcpConfig` and `mcp-project-config.ts` |
| Workflow nested-agent versions | `ProjectWorkflowAgentDetail` (types.ts:254–262) doesn't carry agent versions; v1 ignores | Revisit if workflows ever embed agent system prompts inline |
| Batch version-fetch endpoint | Not needed under D1 (no fan-out) | Re-open only if backend response payloads grow unwieldy |

---

## Suggested Commit Ordering

1. **Backend (out of this repo):** D1 + D2 endpoints land first.
2. **PR 1 — Types + Writers:** Steps 1, 4, 5, 6 + tests for writers.
3. **PR 2 — Resilience:** Step 3 (`Promise.allSettled` rewrite) + integration tests.
4. **PR 3 — Tests:** Step 7 (writer + integration tests).

PR 1 can land after backend ships D1+D2 even before the live-refresh follow-up is scoped — manual re-select is fine for v1.

---

## Risks / Open Questions

All three blocker-level open questions from v1 are now decided (D1, D2, D3). Remaining open:

1. **Backend delivery date for D1+D2.** Confirm with SmartAI/governance team. Frontend PRs can be drafted in parallel but cannot land until backend ships.
2. **Per-item granularity vs. project-level pin.** Per-item is assumed. **Must be confirmed with PM before backend implements D1**, since D1's contract assumes per-item.
3. **MCP scope-out.** Get explicit PM signoff before closing — see Deferred table.

---

## Critical Files for Implementation

- `packages/kilo-vscode/src/services/cli-backend/http-client.ts` (verify only)
- `packages/kilo-vscode/src/services/cli-backend/types.ts` (Step 1)
- `packages/kilo-vscode/src/KiloProvider.ts` (Step 3)
- `packages/kilo-vscode/src/services/cli-backend/agents-project-config.ts` (Step 4)
- `packages/kilo-vscode/src/services/cli-backend/rules-project-config.ts` (Step 5)
- `packages/kilo-vscode/src/services/cli-backend/workflows-project-config.ts` (Step 6)
