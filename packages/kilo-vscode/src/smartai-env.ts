/**
 * OrqentAI Environment Configuration
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
// Dashboard URL
export const SMARTAI_DASHBOARD_URL = "http://localhost:3080"

// ── Default model (keep in sync with package.json kilo-code.new.model.modelID default) ──
export const DEFAULT_MODEL_ID = "OrqentAI/Auto"
