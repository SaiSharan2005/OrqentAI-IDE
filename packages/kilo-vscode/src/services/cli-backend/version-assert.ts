/**
 * Asserts that a project resource (agent, rule, workflow) was returned with a
 * concrete version string from the backend, never `"latest"` or empty.
 *
 * The backend is contracted (D2) to resolve "latest" server-side and always
 * return the resolved concrete version. This guard fails loud at the writer
 * boundary if that contract is ever violated, instead of silently writing
 * `version: "undefined"` or `version: "latest"` to disk.
 *
 * Combined with `Promise.allSettled` in the orchestrator, a single bad-version
 * throw surfaces as a rejected promise for that resource type only — other
 * resources still write successfully.
 */
export function assertConcreteVersion(kind: "agent" | "rule" | "workflow", name: string, version: string): void {
  if (!version || version === "latest") {
    throw new Error(`[Kilo] non-concrete version for ${kind} "${name}": ${JSON.stringify(version)}`)
  }
}
