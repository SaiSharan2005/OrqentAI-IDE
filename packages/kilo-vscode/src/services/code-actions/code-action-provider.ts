import * as vscode from "vscode"

export class KiloCodeActionProvider implements vscode.CodeActionProvider {
  static readonly metadata: vscode.CodeActionProviderMetadata = {
    providedCodeActionKinds: [vscode.CodeActionKind.QuickFix, vscode.CodeActionKind.RefactorRewrite],
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    if (range.isEmpty) return []

    const actions: vscode.CodeAction[] = []

    const add = new vscode.CodeAction("Add to OrqentAI", vscode.CodeActionKind.RefactorRewrite)
    add.command = { command: "orqentai.addToContext", title: "Add to OrqentAI" }
    actions.push(add)

    const hasDiagnostics = context.diagnostics.length > 0

    if (hasDiagnostics) {
      const fix = new vscode.CodeAction("Fix with OrqentAI", vscode.CodeActionKind.QuickFix)
      fix.command = { command: "orqentai.fixCode", title: "Fix with OrqentAI" }
      fix.isPreferred = true
      actions.push(fix)
    }

    if (!hasDiagnostics) {
      const explain = new vscode.CodeAction("Explain with OrqentAI", vscode.CodeActionKind.RefactorRewrite)
      explain.command = { command: "orqentai.explainCode", title: "Explain with OrqentAI" }
      actions.push(explain)

      const improve = new vscode.CodeAction("Improve with OrqentAI", vscode.CodeActionKind.RefactorRewrite)
      improve.command = { command: "orqentai.improveCode", title: "Improve with OrqentAI" }
      actions.push(improve)
    }

    return actions
  }
}
