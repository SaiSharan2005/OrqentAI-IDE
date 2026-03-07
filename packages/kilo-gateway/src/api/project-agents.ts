/**
 * Fetch agent configurations for a project from the Projects-configuration service.
 */

import { PROJECTS_API_BASE, HEADER_ORGANIZATIONID } from "./constants.js"

export interface ProjectLinkedMcpServer {
  publicId: string
  name: string
}

export interface ProjectLinkedRule {
  name: string
  content: string
}

export interface ProjectAgentEntry {
  name: string
  description: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  linkedMcpServers: ProjectLinkedMcpServer[]
  linkedRules: ProjectLinkedRule[]
  source: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

interface ProjectAgentsData {
  projectPublicId: string
  projectName: string
  agents: ProjectAgentEntry[]
}

/**
 * Fetch agent configs from the Projects-configuration service.
 */
export async function fetchProjectAgents(
  token: string,
  projectPublicId: string,
  orgId?: string,
): Promise<ProjectAgentEntry[]> {
  const url = `${PROJECTS_API_BASE}/api/extension/projects/${encodeURIComponent(projectPublicId)}/agents`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }

  if (orgId) {
    headers[HEADER_ORGANIZATIONID] = orgId
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Projects-config agents responded ${response.status}: ${text.slice(0, 200)}`)
  }

  const json = (await response.json()) as ApiResponse<ProjectAgentsData>

  if (!json.success || !json.data?.agents) {
    return []
  }

  return json.data.agents
}
