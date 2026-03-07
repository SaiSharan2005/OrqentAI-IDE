/**
 * Fetch workflow configurations for a project from the Projects-configuration service.
 */

import { PROJECTS_API_BASE, HEADER_ORGANIZATIONID } from "./constants.js"

export interface WorkflowAgentDetail {
  publicId: string
  name: string
  description: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
}

export interface WorkflowNodeEntry {
  nodePublicId: string
  nodeType: string
  label: string
  conditionExpression: string | null
  stepOrder: number
  agent: WorkflowAgentDetail | null
}

export interface WorkflowEdgeEntry {
  sourceNodePublicId: string
  targetNodePublicId: string
  edgeType: string
  label: string | null
  edgeOrder: number
}

export interface ProjectWorkflowEntry {
  name: string
  description: string
  category: string
  source: string
  nodes: WorkflowNodeEntry[]
  edges: WorkflowEdgeEntry[]
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

interface ProjectWorkflowsData {
  projectPublicId: string
  projectName: string
  workflows: ProjectWorkflowEntry[]
}

/**
 * Fetch workflow configs from the Projects-configuration service.
 */
export async function fetchProjectWorkflows(
  token: string,
  projectPublicId: string,
  orgId?: string,
): Promise<ProjectWorkflowEntry[]> {
  const url = `${PROJECTS_API_BASE}/api/extension/projects/${encodeURIComponent(projectPublicId)}/workflows`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }

  if (orgId) {
    headers[HEADER_ORGANIZATIONID] = orgId
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Projects-config workflows responded ${response.status}: ${text.slice(0, 200)}`)
  }

  const json = (await response.json()) as ApiResponse<ProjectWorkflowsData>

  if (!json.success || !json.data?.workflows) {
    return []
  }

  return json.data.workflows
}
