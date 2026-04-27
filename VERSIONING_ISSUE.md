# Versioning Issue: Rules / Agents / Workflows

**Status:** Versioning is NOT being respected by the VS Code extension.

The extension currently fetches whatever the backend returns by default (latest/default version) and writes that to disk. The version selected for each rule/agent/workflow in the project configuration is being ignored end-to-end.

---

## Where it's broken

### 1. API client does not send a `version` parameter
**File:** `packages/kilo-vscode/src/api/http-client.ts` (lines 48–70)

```
GET /kilo/project/{projectPublicId}/agents      ← no version
GET /kilo/project/{projectPublicId}/rules       ← no version
GET /kilo/project/{projectPublicId}/workflows   ← no version
```

The methods involved:
- `getProjectAgents(projectPublicId: string)` — line 48
- `getProjectRules(projectPublicId: string)` — line 56
- `getProjectWorkflows(projectPublicId: string)` — line 64

None of them accept a `version` argument.

### 2. Fetch logic ignores version
**File:** `packages/kilo-vscode/src/core/webview/KiloProvider.ts` (lines 2451–2456)

```ts
const [servers, agents, rules, workflows] = await Promise.all([
  client.getProjectMcpConfig(projectPublicId, platform),
  client.getProjectAgents(projectPublicId),     // no version param
  client.getProjectRules(projectPublicId),      // no version param
  client.getProjectWorkflows(projectPublicId),  // no version param
])
```

### 3. Type definitions are missing a `version` field
**File:** `packages/kilo-vscode/src/api/types.ts` (lines 221–288)

The interfaces `ProjectAgent`, `ProjectRule`, `ProjectWorkflow` do not include a `version` field, so even if the backend sent it, the extension wouldn't know what to do with it.

Current shape:
- `ProjectAgent`: name, description, systemPrompt, model, temperature, maxTokens, linkedMcpServers, linkedRules, source
- `ProjectRule`: name, description, content, source
- `ProjectWorkflow`: name, description, category, source, nodes, edges

### 4. Disk write dumps whatever it got
**File:** `packages/kilo-vscode/src/core/webview/KiloProvider.ts` (lines 2462–2466)

```ts
await Promise.all([
  applyProjectMcpConfigs(projectPublicId, servers, directory),
  applyProjectAgentConfigs(agents, directory),       // takes agents as-is
  applyProjectRuleConfigs(rules, directory),         // takes rules as-is
  applyProjectWorkflowConfigs(workflows, directory), // takes workflows as-is
])
```

No version metadata is stored in the written files, so there's no way to verify what version is actually active in the workspace.

---

## What needs to change

| Layer | File | Change |
|---|---|---|
| API client | `packages/kilo-vscode/src/api/http-client.ts` | Add `version` query param to the 3 GET methods |
| Types | `packages/kilo-vscode/src/api/types.ts` | Add `version` field to `ProjectAgent`, `ProjectRule`, `ProjectWorkflow` |
| Project fetch | `packages/kilo-vscode/src/core/webview/KiloProvider.ts` (~2450) | First fetch the project's selected versions, then pass them to the agent/rule/workflow GETs |
| Write functions | `agents-project-config.ts`, `rules-project-config.ts`, `workflows-project-config.ts` | Store `version` in YAML frontmatter so users can verify what's active |
| Backend (dependency) | `project-config-service` / `governance-service` | Must expose: (a) which version is selected per item for a project, AND (b) accept a `version` query param on the agent/rule/workflow GETs |

---

## Open questions before patching

1. **Is the backend ready?** Do `governance-service` / `project-config-service` actually accept a `version` query param on these endpoints, and is there an endpoint to read the per-project version selection? If not, fixing the frontend alone won't help.
2. **Default behavior:** When no version is selected for an item, should the extension fall back to "latest" or refuse to fetch? Recommend: fall back to latest with a console warning.
