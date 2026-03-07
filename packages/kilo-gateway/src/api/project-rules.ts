/**
 * Fetch rule configurations for a project from the Projects-configuration service.
 */

import { PROJECTS_API_BASE, HEADER_ORGANIZATIONID } from "./constants.js"

export interface ProjectRuleEntry {
  name: string
  description: string
  content: string
  source: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

interface ProjectRulesData {
  projectPublicId: string
  projectName: string
  rules: ProjectRuleEntry[]
}

/**
 * Fetch rule configs from the Projects-configuration service.
 */
export async function fetchProjectRules(
  token: string,
  projectPublicId: string,
  orgId?: string,
): Promise<ProjectRuleEntry[]> {
  const url = `${PROJECTS_API_BASE}/api/extension/projects/${encodeURIComponent(projectPublicId)}/rules`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }

  if (orgId) {
    headers[HEADER_ORGANIZATIONID] = orgId
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Projects-config rules responded ${response.status}: ${text.slice(0, 200)}`)
  }

  const json = (await response.json()) as ApiResponse<ProjectRulesData>

  if (!json.success || !json.data?.rules) {
    return []
  }

  return json.data.rules
}
