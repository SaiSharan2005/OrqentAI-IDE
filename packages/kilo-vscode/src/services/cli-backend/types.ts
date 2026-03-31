// ============================================
// Local types — NOT from the SDK / API
// ============================================
// These types are specific to the VS Code extension and don't have
// equivalents in @kilocode/sdk. All API types (Session, Event, Agent,
// McpStatus, Config, etc.) should be imported from "@kilocode/sdk/v2/client".

/** Connection config used by the extension to reach the local CLI server */
export interface ServerConfig {
  baseUrl: string
  password: string
}

// Provider OAuth types
interface ProviderAuthAuthorization {
  url: string
  method: "auto" | "code"
  instructions: string
}

// Kilo notification from kilo-gateway
export interface KilocodeNotificationAction {
  actionText: string
  actionURL: string
}

export interface KilocodeNotification {
  id: string
  title: string
  message: string
  action?: KilocodeNotificationAction
  showIn?: string[]
  suggestModelId?: string
}

// Profile types from kilo-gateway
export interface KilocodeOrganization {
  id: string
  name: string
  role: string
}

export interface KilocodeProject {
  publicId: string
  companyPublicId?: string
  name: string
  description?: string
  projectRole: string
}

export interface KilocodeProfile {
  email: string
  name?: string
  role?: string
  companyName?: string
  organizations?: KilocodeOrganization[]
  projects?: KilocodeProject[]
}

export interface KilocodeBalance {
  balance: number
}

interface ProfileData {
  profile: KilocodeProfile
  balance: KilocodeBalance | null
  currentOrgId: string | null
}

// MCP server status — discriminated union returned by the backend
export type McpStatus =
  | { status: "connected" }
  | { status: "disabled" }
  | { status: "failed"; error: string }
  | { status: "needs_auth" }
  | { status: "needs_client_registration"; error: string }

// MCP server configuration for local (stdio) servers
export interface McpLocalConfig {
  type: "local"
  command: string[]
  environment?: Record<string, string>
  enabled?: boolean
  timeout?: number
}

// MCP server configuration for remote (SSE) servers
export interface McpRemoteConfig {
  type: "remote"
  url: string
  enabled?: boolean
  headers?: Record<string, string>
  timeout?: number
}

// Union of all MCP server config types
export type McpConfig = McpLocalConfig | McpRemoteConfig

// ============================================
// Backend Config Types (from CLI server)
// ============================================

/** Permission level for a tool */
export type PermissionLevel = "allow" | "ask" | "deny"

/** Per-tool permission configuration */
export type PermissionConfig = Partial<Record<string, PermissionLevel>>

/** Per-agent configuration */
export interface AgentConfig {
  model?: string
  prompt?: string
  temperature?: number
  top_p?: number
  steps?: number
  permission?: PermissionConfig
}

/** Custom provider configuration (OpenAI-compatible) */
export interface ProviderConfig {
  name?: string
  api_key?: string
  base_url?: string
  models?: Record<string, unknown>
}

/** MCP server configuration (backend config shape) */
export interface McpServerConfig {
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
}

/** Custom command configuration */
export interface CommandConfig {
  command: string
  description?: string
}

/** Skills configuration */
export interface SkillsConfig {
  paths?: string[]
  urls?: string[]
}

/** Compaction configuration */
export interface CompactionConfig {
  auto?: boolean
  prune?: boolean
}

/** Watcher configuration */
export interface WatcherConfig {
  ignore?: string[]
}

/** Experimental flags */
export interface ExperimentalConfig {
  disable_paste_summary?: boolean
  batch_tool?: boolean
  primary_tools?: string[]
  continue_loop_on_deny?: boolean
  mcp_timeout?: number
}

/** Full backend Config object (partial — all fields optional for PATCH) */
export interface Config {
  permission?: PermissionConfig
  model?: string
  small_model?: string
  default_agent?: string
  agent?: Record<string, AgentConfig>
  provider?: Record<string, ProviderConfig>
  disabled_providers?: string[]
  enabled_providers?: string[]
  mcp?: Record<string, McpServerConfig>
  command?: Record<string, CommandConfig>
  instructions?: string[]
  skills?: SkillsConfig
  snapshot?: boolean
  share?: "manual" | "auto" | "disabled"
  username?: string
  watcher?: WatcherConfig
  formatter?: false | Record<string, unknown>
  lsp?: false | Record<string, unknown>
  compaction?: CompactionConfig
  tools?: Record<string, boolean>
  layout?: "auto" | "stretch"
  experimental?: ExperimentalConfig
}

// Project MCP server configuration from Projects-configuration service
export interface ProjectMcpServer {
  name: string
  platform: string
  command: string
  args: string
  envKeys: string
  authToken: string
}

export interface ProjectMcpResult {
  written: string[]
  failed: string[]
  filePath: string
}

// Project agent configuration from Projects-configuration service
export interface ProjectAgentLinkedMcp {
  publicId: string
  name: string
}

export interface ProjectAgentLinkedRule {
  name: string
  content: string
}

export interface ProjectAgent {
  name: string
  description: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  linkedMcpServers: ProjectAgentLinkedMcp[]
  linkedRules: ProjectAgentLinkedRule[]
  source: string
}

export interface ProjectAgentResult {
  written: string[]
  failed: string[]
  dirPath: string
}

// Project rule configuration from Projects-configuration service
export interface ProjectRule {
  name: string
  description: string
  content: string
  source: string
}

export interface ProjectRuleResult {
  written: string[]
  failed: string[]
  dirPath: string
}

// Project workflow configuration from Projects-configuration service
export interface ProjectWorkflowAgentDetail {
  publicId: string
  name: string
  description: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
}

export interface ProjectWorkflowNode {
  nodePublicId: string
  nodeType: string
  label: string
  conditionExpression: string | null
  stepOrder: number
  agent: ProjectWorkflowAgentDetail | null
}

export interface ProjectWorkflowEdge {
  sourceNodePublicId: string
  targetNodePublicId: string
  edgeType: string
  label: string | null
  edgeOrder: number
}

export interface ProjectWorkflow {
  name: string
  description: string
  category: string
  source: string
  nodes: ProjectWorkflowNode[]
  edges: ProjectWorkflowEdge[]
}

export interface ProjectWorkflowResult {
  written: string[]
  failed: string[]
  dirPath: string
}

// COGNI Knowledge Graph types
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

// Cloud session from the Kilo cloud API (cli_sessions_v2)
interface CloudSessionInfo {
  session_id: string
  title: string | null
  created_at: string
  updated_at: string
  version: number
}

// Full cloud session data for preview (from /kilo/cloud/session/:id)
export interface CloudSessionMessage {
  info: {
    id: string
    sessionID: string
    role: "user" | "assistant"
    time: { created: number; completed?: number }
    cost?: { input: number; output: number; reasoning?: number; cache?: { read: number; write: number } }
    tokens?: { input: number; output: number; reasoning?: number; cache?: { read: number; write: number } }
    [key: string]: unknown
  }
  parts: Array<{
    id: string
    sessionID: string
    messageID: string
    type: string
    [key: string]: unknown
  }>
}

export interface CloudSessionData {
  info: {
    id: string
    title: string
    time: { created: number; updated: number }
    [key: string]: unknown
  }
  messages: CloudSessionMessage[]
}

/** VS Code editor context sent alongside messages to the CLI backend */
interface WorktreeFileDiff {
  file: string
  before: string
  after: string
  additions: number
  deletions: number
  status?: "added" | "deleted" | "modified"
}

export interface EditorContext {
  /** Workspace-relative paths of currently visible editors */
  visibleFiles?: string[]
  /** Workspace-relative paths of open tabs */
  openTabs?: string[]
  /** Workspace-relative path of the active editor file */
  activeFile?: string
  /** User's default shell (from vscode.env.shell) */
  shell?: string
}
