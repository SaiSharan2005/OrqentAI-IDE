import { Component, createSignal, createEffect, onMount, onCleanup, Show, For } from "solid-js"
import type {
  ProfileData,
  CogniStatusMessage,
  CogniScanProgressMessage,
  CogniScanResultMessage,
  CogniGetStatusMessage,
  CogniScanMessage,
  CogniPickFolderMessage,
  WebviewMessage,
} from "../../types/messages"
import { useVSCode } from "../../context/vscode"

type CogniStatusData = NonNullable<CogniStatusMessage["data"]>
type ScanProgress = Pick<CogniScanProgressMessage, "phase" | "filesRead" | "totalFiles" | "currentFile">

interface CogniViewProps {
  profileData: ProfileData | null | undefined
  onBack: () => void
}

const postCogniMessage = (vscode: { postMessage: (msg: WebviewMessage) => void }, msg: CogniGetStatusMessage | CogniScanMessage | CogniPickFolderMessage) => {
  vscode.postMessage(msg)
}

export const CogniView: Component<CogniViewProps> = (props) => {
  const vscode = useVSCode()

  // Project picker state
  const [selectedProject, setSelectedProject] = createSignal<{ publicId: string; companyPublicId?: string; name: string } | null>(null)

  // Status state
  const [status, setStatus] = createSignal<CogniStatusData | null>(null)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  // Scan state
  const [showScanForm, setShowScanForm] = createSignal(false)
  const [serviceName, setServiceName] = createSignal("")
  const [folderPath, setFolderPath] = createSignal("")
  const [scanning, setScanning] = createSignal(false)
  const [scanProgress, setScanProgress] = createSignal<ScanProgress | null>(null)
  const [scanResult, setScanResult] = createSignal<{ success: boolean; filesProcessed?: number; functionsFound?: number; filesSkipped?: number; error?: string } | null>(null)

  // Derived: company info from selected project's companyPublicId
  const companyId = () => selectedProject()?.companyPublicId ?? props.profileData?.currentOrgId ?? "personal"
  const companyName = () => {
    const orgId = props.profileData?.currentOrgId
    if (!orgId) return props.profileData?.profile.companyName ?? "Personal"
    return props.profileData?.profile.organizations?.find(o => o.id === orgId)?.name ?? "Unknown"
  }

  // Projects list
  const projects = () => props.profileData?.profile.projects ?? []

  // Auto-select first project if only one
  createEffect(() => {
    const p = projects()
    if (p.length === 1 && !selectedProject()) {
      setSelectedProject({ publicId: p[0].publicId, companyPublicId: p[0].companyPublicId, name: p[0].name })
    }
  })

  // Fetch status when project is selected
  createEffect(() => {
    const cid = companyId()
    const proj = selectedProject()
    if (cid && proj) {
      setLoading(true)
      setError(null)
      setStatus(null)
      postCogniMessage(vscode, { type: "cogniGetStatus", companyId: cid, projectId: proj.publicId })
    }
  })

  // Listen for messages from extension
  onMount(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data
      switch (msg?.type) {
        case "cogniStatus":
          setLoading(false)
          if (msg.error) {
            setError(msg.error)
          } else {
            setStatus(msg.data)
          }
          break
        case "cogniScanProgress":
          setScanProgress({ phase: msg.phase, filesRead: msg.filesRead, totalFiles: msg.totalFiles, currentFile: msg.currentFile })
          break
        case "cogniScanResult":
          setScanning(false)
          setScanProgress(null)
          setScanResult(msg)
          if (msg.success) {
            // Refresh status
            const cid = companyId()
            const proj = selectedProject()
            if (cid && proj) {
              postCogniMessage(vscode, { type: "cogniGetStatus", companyId: cid, projectId: proj.publicId })
            }
          }
          break
        case "cogniFolderPicked":
          setFolderPath(msg.folderPath)
          break
      }
    }
    window.addEventListener("message", handler)
    onCleanup(() => window.removeEventListener("message", handler))
  })

  const handleScan = () => {
    const cid = companyId()
    const proj = selectedProject()
    if (!cid || !proj || !serviceName().trim() || !folderPath().trim()) return

    setScanning(true)
    setScanResult(null)
    setScanProgress(null)
    postCogniMessage(vscode, {
      type: "cogniScan",
      companyId: cid,
      companyName: companyName(),
      projectId: proj.publicId,
      projectName: proj.name,
      serviceName: serviceName().trim(),
      folderPath: folderPath().trim(),
    })
  }

  const handleBrowse = () => {
    postCogniMessage(vscode, { type: "cogniPickFolder" })
  }

  const handleRetry = () => {
    const cid = companyId()
    const proj = selectedProject()
    if (cid && proj) {
      setLoading(true)
      setError(null)
      postCogniMessage(vscode, { type: "cogniGetStatus", companyId: cid, projectId: proj.publicId })
    }
  }

  // ── Render ──

  // Not logged in
  if (!props.profileData) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={props.onBack}>← Back</button>
          <h2 style={titleStyle}>COGNI Knowledge Graph</h2>
        </div>
        <div style={emptyStyle}>
          <p>Login required. Go to Profile tab to sign in.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <button style={backBtnStyle} onClick={props.onBack}>← Back</button>
        <h2 style={titleStyle}>COGNI Knowledge Graph</h2>
      </div>

      {/* Project picker */}
      <Show when={projects().length === 0}>
        <div style={emptyStyle}>
          <p>No projects found. Create one in the web dashboard first.</p>
        </div>
      </Show>

      <Show when={projects().length > 0}>
        <div style={sectionStyle}>
          <label style={labelStyle}>Project</label>
          <select
            style={selectStyle}
            value={selectedProject()?.publicId ?? ""}
            onChange={(e) => {
              const proj = projects().find(p => p.publicId === e.currentTarget.value)
              if (proj) setSelectedProject({ publicId: proj.publicId, companyPublicId: proj.companyPublicId, name: proj.name })
            }}
          >
            <option value="" disabled>Select a project...</option>
            <For each={projects()}>
              {(p) => <option value={p.publicId}>{p.name}</option>}
            </For>
          </select>
        </div>

        {/* Loading */}
        <Show when={loading()}>
          <div style={emptyStyle}><p>Loading COGNI status...</p></div>
        </Show>

        {/* Error */}
        <Show when={error() && !loading()}>
          <div style={emptyStyle}>
            <p style={{ color: "var(--vscode-errorForeground)" }}>COGNI unavailable: {error()}</p>
            <button style={primaryBtnStyle} onClick={handleRetry}>Retry</button>
          </div>
        </Show>

        {/* Status loaded */}
        <Show when={status() && !loading() && !error()}>
          {/* Stats */}
          <Show when={status()!.initialized && status()!.service_count > 0}>
            <div style={statsGridStyle}>
              <StatCard label="Services" value={status()!.service_count} />
              <StatCard label="Files" value={status()!.file_count} />
              <StatCard label="Functions" value={status()!.function_count} />
              <StatCard label="Requirements" value={status()!.requirement_count} />
            </div>

            {/* Services list */}
            <div style={sectionStyle}>
              <h3 style={subtitleStyle}>Services</h3>
              <For each={status()!.services}>
                {(s) => (
                  <div style={serviceCardStyle}>
                    <span style={{ fontWeight: 500 }}>{s.name}</span>
                    <span style={badgeStyle}>{s.file_count} files</span>
                  </div>
                )}
              </For>
            </div>
          </Show>

          {/* Empty or "Scan more" prompt */}
          <Show when={!status()!.initialized || status()!.service_count === 0}>
            <div style={emptyStyle}>
              <p>No services scanned yet. Scan your codebase to build the knowledge graph.</p>
            </div>
          </Show>

          {/* Scan button */}
          <div style={sectionStyle}>
            <button style={primaryBtnStyle} onClick={() => { setShowScanForm(true); setScanResult(null) }}>
              {status()!.service_count > 0 ? "Scan More" : "Scan Codebase"}
            </button>
          </div>
        </Show>

        {/* Also show scan button if status not yet loaded but project is selected */}
        <Show when={!status() && !loading() && !error() && selectedProject()}>
          <div style={sectionStyle}>
            <button style={primaryBtnStyle} onClick={() => { setShowScanForm(true); setScanResult(null) }}>
              Scan Codebase
            </button>
          </div>
        </Show>

        {/* Scan form */}
        <Show when={showScanForm() && !scanning()}>
          <div style={formStyle}>
            <h3 style={subtitleStyle}>Scan Codebase</h3>
            <div style={fieldStyle}>
              <label style={labelStyle}>Service Name</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="e.g. Auth-Service"
                value={serviceName()}
                onInput={(e) => setServiceName(e.currentTarget.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Folder Path</label>
              <div style={{ display: "flex", gap: "4px" }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  type="text"
                  placeholder="Select folder to scan..."
                  value={folderPath()}
                  onInput={(e) => setFolderPath(e.currentTarget.value)}
                />
                <button style={secondaryBtnStyle} onClick={handleBrowse}>Browse</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", "margin-top": "8px" }}>
              <button
                style={primaryBtnStyle}
                onClick={handleScan}
                disabled={!serviceName().trim() || !folderPath().trim()}
              >
                Scan
              </button>
              <button style={secondaryBtnStyle} onClick={() => setShowScanForm(false)}>Cancel</button>
            </div>
          </div>
        </Show>

        {/* Scanning progress */}
        <Show when={scanning()}>
          <div style={formStyle}>
            <h3 style={subtitleStyle}>Scanning...</h3>
            <Show when={scanProgress()}>
              <p style={smallTextStyle}>
                {scanProgress()!.phase === "reading" ? "Reading files" : "Uploading to COGNI"}...
                {" "}{scanProgress()!.filesRead}/{scanProgress()!.totalFiles}
              </p>
              <div style={progressBarBg}>
                <div style={{
                  ...progressBarFill,
                  width: scanProgress()!.totalFiles > 0
                    ? `${Math.round((scanProgress()!.filesRead / scanProgress()!.totalFiles) * 100)}%`
                    : "0%",
                }} />
              </div>
              <p style={smallTextStyle}>{scanProgress()!.currentFile}</p>
            </Show>
            <Show when={!scanProgress()}>
              <p style={smallTextStyle}>Preparing...</p>
            </Show>
          </div>
        </Show>

        {/* Scan result */}
        <Show when={scanResult()}>
          <div style={{ ...formStyle, "border-color": scanResult()!.success ? "var(--vscode-testing-iconPassed)" : "var(--vscode-errorForeground)" }}>
            <Show when={scanResult()!.success}>
              <p style={{ color: "var(--vscode-testing-iconPassed)" }}>
                Scan complete! {scanResult()!.filesProcessed} files, {scanResult()!.functionsFound} functions
                {scanResult()!.filesSkipped ? `, ${scanResult()!.filesSkipped} skipped` : ""}
              </p>
            </Show>
            <Show when={!scanResult()!.success}>
              <p style={{ color: "var(--vscode-errorForeground)" }}>Scan failed: {scanResult()!.error}</p>
            </Show>
          </div>
        </Show>
      </Show>
    </div>
  )
}

// ── Sub-components ──

const StatCard: Component<{ label: string; value: number }> = (props) => (
  <div style={statCardStyle}>
    <div style={{ "font-size": "18px", "font-weight": "600", color: "var(--vscode-foreground)" }}>{props.value}</div>
    <div style={{ "font-size": "11px", color: "var(--vscode-descriptionForeground)" }}>{props.label}</div>
  </div>
)

// ── Styles ──

const containerStyle: Record<string, string> = {
  display: "flex",
  "flex-direction": "column",
  height: "100%",
  overflow: "auto",
  padding: "12px",
  gap: "12px",
}

const headerStyle: Record<string, string> = {
  display: "flex",
  "align-items": "center",
  gap: "8px",
}

const backBtnStyle: Record<string, string> = {
  background: "none",
  border: "none",
  color: "var(--vscode-textLink-foreground)",
  cursor: "pointer",
  "font-size": "13px",
  padding: "4px",
}

const titleStyle: Record<string, string> = {
  "font-size": "16px",
  "font-weight": "600",
  color: "var(--vscode-foreground)",
  margin: "0",
}

const emptyStyle: Record<string, string> = {
  "text-align": "center",
  padding: "24px 12px",
  color: "var(--vscode-descriptionForeground)",
  "font-size": "13px",
}

const sectionStyle: Record<string, string> = {
  display: "flex",
  "flex-direction": "column",
  gap: "6px",
}

const labelStyle: Record<string, string> = {
  "font-size": "12px",
  "font-weight": "500",
  color: "var(--vscode-foreground)",
}

const inputStyle: Record<string, string> = {
  width: "100%",
  padding: "6px 8px",
  "font-size": "13px",
  background: "var(--vscode-input-background)",
  color: "var(--vscode-input-foreground)",
  border: "1px solid var(--vscode-input-border, transparent)",
  "border-radius": "4px",
  outline: "none",
}

const selectStyle = inputStyle

const primaryBtnStyle: Record<string, string> = {
  padding: "6px 14px",
  "font-size": "13px",
  "font-weight": "500",
  background: "var(--vscode-button-background)",
  color: "var(--vscode-button-foreground)",
  border: "none",
  "border-radius": "4px",
  cursor: "pointer",
}

const secondaryBtnStyle: Record<string, string> = {
  padding: "6px 14px",
  "font-size": "13px",
  background: "var(--vscode-button-secondaryBackground)",
  color: "var(--vscode-button-secondaryForeground)",
  border: "none",
  "border-radius": "4px",
  cursor: "pointer",
}

const subtitleStyle: Record<string, string> = {
  "font-size": "14px",
  "font-weight": "600",
  color: "var(--vscode-foreground)",
  margin: "0",
}

const statsGridStyle: Record<string, string> = {
  display: "grid",
  "grid-template-columns": "1fr 1fr",
  gap: "8px",
}

const statCardStyle: Record<string, string> = {
  padding: "10px",
  background: "var(--vscode-editor-background)",
  border: "1px solid var(--vscode-panel-border, var(--vscode-widget-border, transparent))",
  "border-radius": "6px",
  "text-align": "center",
}

const serviceCardStyle: Record<string, string> = {
  display: "flex",
  "justify-content": "space-between",
  "align-items": "center",
  padding: "8px 10px",
  background: "var(--vscode-editor-background)",
  border: "1px solid var(--vscode-panel-border, var(--vscode-widget-border, transparent))",
  "border-radius": "4px",
  "font-size": "13px",
  color: "var(--vscode-foreground)",
}

const badgeStyle: Record<string, string> = {
  "font-size": "11px",
  color: "var(--vscode-descriptionForeground)",
  padding: "2px 6px",
  background: "var(--vscode-badge-background)",
  "border-radius": "10px",
}

const formStyle: Record<string, string> = {
  display: "flex",
  "flex-direction": "column",
  gap: "8px",
  padding: "12px",
  background: "var(--vscode-editor-background)",
  border: "1px solid var(--vscode-panel-border, var(--vscode-widget-border, transparent))",
  "border-radius": "6px",
}

const fieldStyle: Record<string, string> = {
  display: "flex",
  "flex-direction": "column",
  gap: "4px",
}

const smallTextStyle: Record<string, string> = {
  "font-size": "12px",
  color: "var(--vscode-descriptionForeground)",
  margin: "0",
  overflow: "hidden",
  "text-overflow": "ellipsis",
  "white-space": "nowrap",
}

const progressBarBg: Record<string, string> = {
  width: "100%",
  height: "6px",
  background: "var(--vscode-progressBar-background, #333)",
  "border-radius": "3px",
  overflow: "hidden",
}

const progressBarFill: Record<string, string> = {
  height: "100%",
  background: "var(--vscode-progressBar-background, var(--vscode-button-background))",
  "border-radius": "3px",
  transition: "width 0.3s ease",
}
