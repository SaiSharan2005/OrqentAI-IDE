/**
 * SmartAI Environment Configuration
 *
 * Change these URLs to switch between local and production.
 * This is the ONLY file you need to edit when switching environments.
 */

// ── Production (uncomment below, comment local) ──
// export const SMARTAI_GATEWAY_URL = "http://18.60.129.9:9081"

// ── Local ──
export const SMARTAI_GATEWAY_URL = "http://localhost:8081"

// ── Derived URLs (do not edit) ──
export const SMARTAI_GOVERNANCE_URL = `${SMARTAI_GATEWAY_URL}/gateway/governance-service`
export const SMARTAI_PROJECT_CONFIG_URL = `${SMARTAI_GATEWAY_URL}/gateway/project-config-service`
// Dashboard runs on port 3080 (production) or 3000 (local)
export const SMARTAI_DASHBOARD_URL = (() => {
  const url = new URL(SMARTAI_GATEWAY_URL)
  url.port = url.port === "9081" ? "3080" : "3000"
  return url.origin
})()

// ── Default model (keep in sync with package.json kilo-code.new.model.modelID default) ──
export const DEFAULT_MODEL_ID = "smartAI/Auto"
