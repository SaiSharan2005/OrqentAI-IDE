/**
 * Fetch MCP server configurations for a project from the Projects-configuration service.
 */

import { PROJECTS_API_BASE, HEADER_ORGANIZATIONID } from "./constants.js"

export interface ProjectMcpServerConfig {
  name: string
  platform: string
  command: string
  args: string
  envKeys: string
  authToken: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

interface ProjectMcpConfigData {
  projectPublicId: string
  projectName: string
  mcpServers: ProjectMcpServerConfig[]
}

/**
 * Fetch MCP configs from the Projects-configuration service.
 * Security: Never logs token or response envKeys/authToken values.
 */
export async function fetchProjectMcpConfig(
  token: string,
  projectPublicId: string,
  platform: string,
  orgId?: string,
): Promise<ProjectMcpServerConfig[]> {
  const url = `${PROJECTS_API_BASE}/api/extension/projects/${encodeURIComponent(projectPublicId)}/mcp-config?platform=${encodeURIComponent(platform)}`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }

  if (orgId) {
    headers[HEADER_ORGANIZATIONID] = orgId
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Projects-config responded ${response.status}: ${text.slice(0, 200)}`)
  }

  const json = (await response.json()) as ApiResponse<ProjectMcpConfigData>

  if (!json.success || !json.data?.mcpServers) {
    return []
  }

  return json.data.mcpServers
}
