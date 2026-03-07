/**
 * Writes project agent configs to .kilocode/agents/ in the workspace directory.
 * Each agent becomes a .md file with YAML frontmatter and system prompt as body.
 */

import * as fs from "fs"
import * as path from "path"
import type { ProjectAgent, ProjectAgentResult } from "./types"

export type { ProjectAgent, ProjectAgentResult }

/**
 * Slugify an agent name for use as a filename.
 * "Business Analyst" -> "business-analyst"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Build YAML frontmatter string from agent data.
 */
function buildFrontmatter(agent: ProjectAgent): string {
  const lines: string[] = []
  lines.push("---")
  lines.push(`name: "${agent.name}"`)
  if (agent.description) lines.push(`description: "${agent.description}"`)
  if (agent.model) lines.push(`model: "${agent.model}"`)
  if (agent.temperature != null) lines.push(`temperature: ${agent.temperature}`)
  if (agent.maxTokens != null) lines.push(`maxTokens: ${agent.maxTokens}`)
  lines.push(`source: "${agent.source}"`)

  if (agent.linkedMcpServers && agent.linkedMcpServers.length > 0) {
    lines.push("mcpServers:")
    for (const mcp of agent.linkedMcpServers) {
      lines.push(`  - "${mcp.name}"`)
    }
  }

  if (agent.linkedRules && agent.linkedRules.length > 0) {
    lines.push("rules:")
    for (const rule of agent.linkedRules) {
      const ruleSlug = slugify(rule.name)
      lines.push(`  - .kilocode/rules/${ruleSlug}.md`)
    }
  }

  lines.push("---")
  return lines.join("\n")
}

/**
 * Convert project agents to .md files and write to .kilocode/agents/.
 */
export async function applyProjectAgentConfigs(
  agents: ProjectAgent[],
  directory: string,
): Promise<ProjectAgentResult> {
  const agentsDir = path.join(directory, ".kilocode", "agents")
  const result: ProjectAgentResult = { written: [], failed: [], dirPath: agentsDir }

  if (!agents || agents.length === 0) {
    return result
  }

  try {
    fs.mkdirSync(agentsDir, { recursive: true })

    // Clean existing agent files
    try {
      const existing = fs.readdirSync(agentsDir)
      for (const file of existing) {
        if (file.endsWith(".md")) {
          fs.unlinkSync(path.join(agentsDir, file))
        }
      }
    } catch {
      // Directory may not exist yet
    }

    for (const agent of agents) {
      if (!agent.name) {
        result.failed.push(agent.name || "unknown")
        continue
      }

      try {
        const slug = slugify(agent.name)
        const filePath = path.join(agentsDir, `${slug}.md`)
        const frontmatter = buildFrontmatter(agent)
        const body = agent.systemPrompt || ""
        const content = `${frontmatter}\n\n${body}\n`

        fs.writeFileSync(filePath, content, "utf-8")
        result.written.push(agent.name)
      } catch (err: any) {
        console.error(`[Agents Project Config] Failed to write agent "${agent.name}":`, err?.message)
        result.failed.push(agent.name)
      }
    }
  } catch (err: any) {
    console.error(`[Agents Project Config] Failed to write to ${agentsDir}:`, err?.message)
    result.failed = agents.map((a) => a.name || "unknown")
    result.written = []
  }

  return result
}
