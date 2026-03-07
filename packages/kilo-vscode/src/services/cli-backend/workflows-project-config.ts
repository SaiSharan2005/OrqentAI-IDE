/**
 * Writes project workflow configs to .kilocode/workflows/ in the workspace directory.
 * Each workflow becomes a folder with a workflow.md file.
 * Workflow steps reference agents from .kilocode/agents/.
 */

import * as fs from "fs"
import * as path from "path"
import type { ProjectWorkflow, ProjectWorkflowNode, ProjectWorkflowEdge, ProjectWorkflowResult } from "./types"

export type { ProjectWorkflow, ProjectWorkflowResult }

/**
 * Slugify a name for use as a folder/filename.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Build the workflow.md content from workflow data.
 */
function buildWorkflowMarkdown(workflow: ProjectWorkflow): string {
  const lines: string[] = []

  // Frontmatter
  lines.push("---")
  lines.push(`name: "${workflow.name}"`)
  if (workflow.description) lines.push(`description: "${workflow.description}"`)
  if (workflow.category) lines.push(`category: "${workflow.category}"`)
  lines.push(`source: "${workflow.source}"`)
  lines.push("---")
  lines.push("")

  // Title
  lines.push(`# ${workflow.name}`)
  lines.push("")
  if (workflow.description) {
    lines.push(workflow.description)
    lines.push("")
  }
  lines.push("---")
  lines.push("")

  // Sort nodes by stepOrder
  const sortedNodes = [...workflow.nodes].sort(
    (a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0),
  )

  // Build a node lookup for condition routing
  const nodeById = new Map<string, ProjectWorkflowNode>()
  for (const node of sortedNodes) {
    nodeById.set(node.nodePublicId, node)
  }

  // Build edge lookup: sourceNodeId -> edges[]
  const edgesBySource = new Map<string, ProjectWorkflowEdge[]>()
  for (const edge of workflow.edges) {
    const existing = edgesBySource.get(edge.sourceNodePublicId) || []
    existing.push(edge)
    edgesBySource.set(edge.sourceNodePublicId, existing)
  }

  let stepNum = 0

  for (const node of sortedNodes) {
    // Skip START and END nodes — they're structural
    if (node.nodeType === "START" || node.nodeType === "END") {
      continue
    }

    stepNum++

    if (node.nodeType === "AGENT" && node.agent) {
      const agentSlug = slugify(node.agent.name)
      const agentPath = `.kilocode/agents/${agentSlug}.md`

      lines.push(`## Step ${stepNum}: ${node.label}`)
      lines.push(`- **Agent:** [${node.agent.name}](${agentPath})`)

      // Extract command from description if present (pattern: "Command: /some-command")
      const cmdMatch = node.conditionExpression
        ? null
        : (node as any).description?.match(/Command:\s*(\/[\w-]+)/)
      if (cmdMatch) {
        lines.push(`- **Command:** \`${cmdMatch[1]}\``)
      }

      lines.push("")

      // Use node description if available, strip the "Phase X - Y | Command: /foo |" prefix
      if ((node as any).description) {
        let desc = (node as any).description as string
        // Remove "Phase X - Name | Command: /xxx | " prefix if present
        const pipeIdx = desc.lastIndexOf("| ")
        if (pipeIdx !== -1 && desc.includes("Command:")) {
          desc = desc.slice(pipeIdx + 2).trim()
        }
        lines.push(desc)
      }

      lines.push("")
    } else if (node.nodeType === "CONDITION") {
      lines.push(`## Step ${stepNum}: ${node.label}`)
      lines.push(`- **Type:** Condition`)
      if (node.conditionExpression) {
        lines.push(`- **Expression:** \`${node.conditionExpression}\``)
      }

      // Find outgoing edges for true/false paths
      const outEdges = edgesBySource.get(node.nodePublicId) || []
      for (const edge of outEdges) {
        const targetNode = nodeById.get(edge.targetNodePublicId)
        const targetLabel = targetNode?.label || "Unknown"
        if (edge.edgeType === "CONDITIONAL_TRUE") {
          lines.push(`- **If true ->** ${targetLabel}`)
        } else if (edge.edgeType === "CONDITIONAL_FALSE") {
          lines.push(`- **If false ->** ${targetLabel}`)
        }
      }

      lines.push("")
    } else {
      // Generic node type
      lines.push(`## Step ${stepNum}: ${node.label}`)
      lines.push(`- **Type:** ${node.nodeType}`)
      lines.push("")
    }
  }

  return lines.join("\n")
}

/**
 * Convert project workflows to folder/workflow.md and write to .kilocode/workflows/.
 */
export async function applyProjectWorkflowConfigs(
  workflows: ProjectWorkflow[],
  directory: string,
): Promise<ProjectWorkflowResult> {
  const workflowsDir = path.join(directory, ".kilocode", "workflows")
  const result: ProjectWorkflowResult = { written: [], failed: [], dirPath: workflowsDir }

  if (!workflows || workflows.length === 0) {
    return result
  }

  try {
    fs.mkdirSync(workflowsDir, { recursive: true })

    // Clean existing workflow folders
    try {
      const existing = fs.readdirSync(workflowsDir)
      for (const entry of existing) {
        const entryPath = path.join(workflowsDir, entry)
        const stat = fs.statSync(entryPath)
        if (stat.isDirectory()) {
          fs.rmSync(entryPath, { recursive: true, force: true })
        }
      }
    } catch {
      // Directory may not exist yet
    }

    for (const workflow of workflows) {
      if (!workflow.name) {
        result.failed.push(workflow.name || "unknown")
        continue
      }

      try {
        const slug = slugify(workflow.name)
        const workflowDir = path.join(workflowsDir, slug)
        fs.mkdirSync(workflowDir, { recursive: true })

        const content = buildWorkflowMarkdown(workflow)
        const filePath = path.join(workflowDir, "workflow.md")
        fs.writeFileSync(filePath, content, "utf-8")

        result.written.push(workflow.name)
      } catch (err: any) {
        console.error(`[Workflows Project Config] Failed to write workflow "${workflow.name}":`, err?.message)
        result.failed.push(workflow.name)
      }
    }
  } catch (err: any) {
    console.error(`[Workflows Project Config] Failed to write to ${workflowsDir}:`, err?.message)
    result.failed = workflows.map((w) => w.name || "unknown")
    result.written = []
  }

  return result
}
