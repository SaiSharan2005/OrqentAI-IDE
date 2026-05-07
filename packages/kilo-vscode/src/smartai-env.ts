/**
 * OrqentAI Environment Configuration
 *
 * Production URL is the default. For local development, set the
 * environment variable ORQENTAI_GATEWAY_URL before launching VS Code:
 *
 *   ORQENTAI_GATEWAY_URL=http://localhost:8081 code .
 */

// ── Production (default) ──
const PRODUCTION_GATEWAY_URL = "http://18.60.129.9:9081"
const LOCAL_GATEWAY_URL = "http://localhost:8081"

// ── Gateway URL (env var override for local dev) ──
const GATEWAY_URL = process.env.ORQENTAI_GATEWAY_URL || PRODUCTION_GATEWAY_URL

export function getGatewayUrl(): string {
  return GATEWAY_URL
}

export function getGovernanceUrl(): string {
  return `${GATEWAY_URL}/gateway/governance-service`
}

export function getProjectConfigUrl(): string {
  return `${GATEWAY_URL}/gateway/project-config-service`
}

export function getCogniUrl(): string {
  return `${GATEWAY_URL}/gateway/cogni-service`
}

export function getDashboardUrl(): string {
  if (GATEWAY_URL.includes("localhost")) {
    return "http://localhost:3080"
  }
  return GATEWAY_URL.replace(/:\d+$/, ":3080")
}

// ── Default model (keep in sync with package.json orqentai.model.modelID default) ──
export const DEFAULT_MODEL_ID = "OrqentAI/Auto"
