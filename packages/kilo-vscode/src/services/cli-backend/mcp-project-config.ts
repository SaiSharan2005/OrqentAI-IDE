/**
 * Writes project MCP configs to .kilocode/mcp.json in the workspace directory.
 * KiloCode CLI reads this file on startup and connects the servers automatically.
 * On project switch, the file is overwritten with the new project's MCPs.
 */

import * as fs from "fs"
import * as path from "path"
import type { ProjectMcpServer, ProjectMcpResult } from "./types"

export type { ProjectMcpServer, ProjectMcpResult }

let activeProjectId: string | null = null

// Cache: key = `${projectPublicId}:${platform}`, TTL 10min
const CACHE_TTL = 10 * 60 * 1000
const configCache = new Map<string, { data: ProjectMcpServer[]; expiry: number }>()

export function getCachedConfig(key: string): ProjectMcpServer[] | null {
  const entry = configCache.get(key)
  if (!entry || Date.now() > entry.expiry) {
    configCache.delete(key)
    return null
  }
  return entry.data
}

export function setCachedConfig(key: string, data: ProjectMcpServer[]): void {
  configCache.set(key, { data, expiry: Date.now() + CACHE_TTL })
}

/**
 * Parse a command args string into an argv array.
 * Handles "quoted args" and 'single quoted' strings.
 */
function parseArgs(argsStr: string): string[] {
  if (!argsStr) return []
  const args: string[] = []
  let current = ""
  let inDouble = false
  let inSingle = false

  for (const ch of argsStr) {
    if (ch === '"' && !inSingle) { inDouble = !inDouble; continue }
    if (ch === "'" && !inDouble) { inSingle = !inSingle; continue }
    if ((ch === " " || ch === "\t") && !inDouble && !inSingle) {
      if (current) { args.push(current); current = "" }
      continue
    }
    current += ch
  }
  if (current) args.push(current)
  return args
}

/**
 * Parse "KEY1=value1,KEY2=value2" into a Record.
 */
function parseEnvKeys(envKeys: string): Record<string, string> {
  if (!envKeys) return {}
  const env: Record<string, string> = {}
  for (const entry of envKeys.split(",")) {
    const eqIdx = entry.indexOf("=")
    if (eqIdx < 1) continue
    const key = entry.slice(0, eqIdx).trim()
    if (key) env[key] = entry.slice(eqIdx + 1).trim()
  }
  return env
}

/**
 * Convert project MCP servers to KiloCode format and write to .kilocode/mcp.json.
 */
export async function applyProjectMcpConfigs(
  projectPublicId: string,
  mcpServers: ProjectMcpServer[],
  directory: string,
): Promise<ProjectMcpResult> {
  const mcpJsonPath = path.join(directory, ".kilocode", "mcp.json")

  if (projectPublicId === activeProjectId) {
    return { written: [], failed: [], filePath: mcpJsonPath }
  }

  const result: ProjectMcpResult = { written: [], failed: [], filePath: mcpJsonPath }
  const mcpServersObj: Record<string, { command: string; args: string[]; env?: Record<string, string> }> = {}

  for (const server of mcpServers) {
    if (!server.name || !server.command) {
      result.failed.push(server.name || "unknown")
      continue
    }

    const envMap = parseEnvKeys(server.envKeys || "")
    if (server.authToken) envMap["MCP_AUTH_TOKEN"] = server.authToken

    mcpServersObj[server.name] = {
      command: server.command,
      args: parseArgs(server.args || ""),
      ...(Object.keys(envMap).length > 0 && { env: envMap }),
    }
    result.written.push(server.name)
  }

  try {
    fs.mkdirSync(path.dirname(mcpJsonPath), { recursive: true })
    fs.writeFileSync(mcpJsonPath, JSON.stringify({ mcpServers: mcpServersObj }, null, 2), "utf-8")
    activeProjectId = projectPublicId
  } catch (err: any) {
    console.error(`[MCP Project Config] Failed to write ${mcpJsonPath}:`, err?.message)
    result.failed = [...result.written, ...result.failed]
    result.written = []
  }

  return result
}
