import type { ServerConfig, ProjectMcpServer, ProjectAgent, ProjectRule, ProjectWorkflow, CogniStatus, CogniRawIngestResult } from "./types"

/**
 * Slim HTTP Client for SmartAI project config APIs.
 * Only used for custom project configuration endpoints (MCP, agents, rules, workflows, COGNI)
 * that are not part of the upstream SDK.
 */
export class HttpClient {
  private readonly baseUrl: string
  private readonly authHeader: string

  constructor(config: ServerConfig) {
    this.baseUrl = config.baseUrl
    this.authHeader = `Basic ${Buffer.from(`kilo:${config.password}`).toString("base64")}`
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      "Content-Type": "application/json",
    }

    const options: RequestInit = { method, headers }
    if (body !== undefined) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${this.baseUrl}${path}`, options)
    const rawText = await response.text()

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${rawText.slice(0, 200)}`)
    }
    if (rawText.trim().length === 0) {
      return undefined as T
    }
    return JSON.parse(rawText) as T
  }

  async getProjectMcpConfig(projectPublicId: string, platform: string): Promise<ProjectMcpServer[]> {
    const response = await this.request<{ mcpServers: ProjectMcpServer[] }>(
      "GET",
      `/kilo/project/${encodeURIComponent(projectPublicId)}/mcp-config?platform=${encodeURIComponent(platform)}`,
    )
    return response?.mcpServers ?? []
  }

  async getProjectAgents(projectPublicId: string): Promise<ProjectAgent[]> {
    const response = await this.request<{ agents: ProjectAgent[] }>(
      "GET",
      `/kilo/project/${encodeURIComponent(projectPublicId)}/agents`,
    )
    return response?.agents ?? []
  }

  async getProjectRules(projectPublicId: string): Promise<ProjectRule[]> {
    const response = await this.request<{ rules: ProjectRule[] }>(
      "GET",
      `/kilo/project/${encodeURIComponent(projectPublicId)}/rules`,
    )
    return response?.rules ?? []
  }

  async getProjectWorkflows(projectPublicId: string): Promise<ProjectWorkflow[]> {
    const response = await this.request<{ workflows: ProjectWorkflow[] }>(
      "GET",
      `/kilo/project/${encodeURIComponent(projectPublicId)}/workflows`,
    )
    return response?.workflows ?? []
  }

  // ── COGNI Knowledge Graph ──────────────────────────────────────────

  async getCogniStatus(companyId: string, projectId: string): Promise<CogniStatus> {
    return this.request<CogniStatus>(
      "GET",
      `/kilo/cogni/status/${encodeURIComponent(companyId)}/${encodeURIComponent(projectId)}`,
    )
  }

  async cogniRawIngest(
    companyId: string,
    projectId: string,
    body: { service_name: string; company_name: string; project_name: string; files: Array<{ file_name: string; content: string }> },
  ): Promise<CogniRawIngestResult> {
    return this.request<CogniRawIngestResult>(
      "POST",
      `/kilo/cogni/ingest/raw/${encodeURIComponent(companyId)}/${encodeURIComponent(projectId)}`,
      body,
    )
  }
}
