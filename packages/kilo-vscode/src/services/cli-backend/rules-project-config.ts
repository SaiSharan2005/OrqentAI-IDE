/**
 * Writes project rule configs to .kilocode/rules/ in the workspace directory.
 * Each rule becomes a .md file with YAML frontmatter and rule content as body.
 */

import * as fs from "fs"
import * as path from "path"
import type { ProjectRule, ProjectRuleResult } from "./types"

export type { ProjectRule, ProjectRuleResult }

/**
 * Slugify a rule name for use as a filename.
 * "Code Style Guidelines" -> "code-style-guidelines"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Convert project rules to .md files and write to .kilocode/rules/.
 */
export async function applyProjectRuleConfigs(
  rules: ProjectRule[],
  directory: string,
): Promise<ProjectRuleResult> {
  const rulesDir = path.join(directory, ".kilocode", "rules")
  const result: ProjectRuleResult = { written: [], failed: [], dirPath: rulesDir }

  if (!rules || rules.length === 0) {
    return result
  }

  try {
    fs.mkdirSync(rulesDir, { recursive: true })

    // Clean existing rule files
    try {
      const existing = fs.readdirSync(rulesDir)
      for (const file of existing) {
        if (file.endsWith(".md")) {
          fs.unlinkSync(path.join(rulesDir, file))
        }
      }
    } catch {
      // Directory may not exist yet
    }

    for (const rule of rules) {
      if (!rule.name) {
        result.failed.push(rule.name || "unknown")
        continue
      }

      try {
        const slug = slugify(rule.name)
        const filePath = path.join(rulesDir, `${slug}.md`)

        const lines: string[] = []
        lines.push("---")
        lines.push(`name: "${rule.name}"`)
        if (rule.description) lines.push(`description: "${rule.description}"`)
        lines.push(`source: "${rule.source}"`)
        lines.push("---")
        lines.push("")
        lines.push(rule.content || "")
        lines.push("")

        fs.writeFileSync(filePath, lines.join("\n"), "utf-8")
        result.written.push(rule.name)
      } catch (err: any) {
        console.error(`[Rules Project Config] Failed to write rule "${rule.name}":`, err?.message)
        result.failed.push(rule.name)
      }
    }
  } catch (err: any) {
    console.error(`[Rules Project Config] Failed to write to ${rulesDir}:`, err?.message)
    result.failed = rules.map((r) => r.name || "unknown")
    result.written = []
  }

  return result
}
