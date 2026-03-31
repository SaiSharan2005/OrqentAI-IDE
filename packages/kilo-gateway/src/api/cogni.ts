/**
 * COGNI Knowledge Graph API proxy functions.
 * Routes requests to the COGNI backend with JWT auth.
 */

import { COGNI_API_BASE } from "./constants.js"

export interface CogniStatus {
  initialized: boolean
  company_count?: number
  project_count?: number
  service_count?: number
  function_count?: number
  services?: Array<{ name: string; file_count: number; function_count: number }>
}

export interface CogniRawIngestResult {
  files_processed: number
  functions_found: number
  files_skipped: number
}

/**
 * Fetch COGNI status for a project.
 */
export async function fetchCogniStatus(
  token: string,
  companyId: string,
  projectId: string,
): Promise<CogniStatus> {
  const url = `${COGNI_API_BASE}/api/status/${encodeURIComponent(companyId)}/${encodeURIComponent(projectId)}`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`COGNI status responded ${response.status}: ${text.slice(0, 200)}`)
  }

  return (await response.json()) as CogniStatus
}

/**
 * Ingest raw files into COGNI knowledge graph.
 * Accepts raw JSON string to avoid parse+reserialize overhead on large payloads.
 */
export async function cogniRawIngest(
  token: string,
  companyId: string,
  projectId: string,
  rawBody: string,
): Promise<CogniRawIngestResult> {
  const url = `${COGNI_API_BASE}/api/ingest/raw/${encodeURIComponent(companyId)}/${encodeURIComponent(projectId)}`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: rawBody,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`COGNI ingest responded ${response.status}: ${text.slice(0, 200)}`)
  }

  return (await response.json()) as CogniRawIngestResult
}
