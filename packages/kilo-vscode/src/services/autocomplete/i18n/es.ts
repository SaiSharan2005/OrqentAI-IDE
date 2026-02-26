// es runtime translations for autocomplete

export const dict = {
  "kilocode:autocomplete.statusBar.enabled": "$(kilo-logo) Autocomplete",
  "kilocode:autocomplete.statusBar.snoozed": "pausado",
  "kilocode:autocomplete.statusBar.warning": "$(warning) Autocomplete",
  "kilocode:autocomplete.statusBar.tooltip.basic": "smartAI Autocomplete",
  "kilocode:autocomplete.statusBar.tooltip.disabled": "smartAI Autocomplete (deshabilitado)",
  "kilocode:autocomplete.statusBar.tooltip.noCredits":
    "**No hay créditos en tu cuenta**\n\nTu cuenta de smartAI no tiene créditos. Para usar el autocompletado, por favor añade créditos a tu cuenta.\n\n[Abrir Configuración](command:kilo-code.settingsButtonClicked)",
  "kilocode:autocomplete.statusBar.tooltip.noUsableProvider":
    "**No hay modelo de autocompletado configurado**\n\nPara habilitar el autocompletado, añade un perfil con uno de estos proveedores compatibles: {{providers}}.\n\n[Abrir Configuración](command:kilo-code.settingsButtonClicked)",
  "kilocode:autocomplete.statusBar.tooltip.sessionTotal": "Costo total de la sesión:",
  "kilocode:autocomplete.statusBar.tooltip.provider": "Proveedor:",
  "kilocode:autocomplete.statusBar.tooltip.model": "Modelo:",
  "kilocode:autocomplete.statusBar.tooltip.profile": "Perfil: ",
  "kilocode:autocomplete.statusBar.tooltip.defaultProfile": "Predeterminado",
  "kilocode:autocomplete.statusBar.tooltip.completionSummary":
    "Se realizaron {{count}} completaciones entre {{startTime}} y {{endTime}}, por un costo total de {{cost}}.",
  "kilocode:autocomplete.statusBar.tooltip.providerInfo":
    "Autocompletaciones proporcionadas por {{model}} a través de {{provider}}.",
  "kilocode:autocomplete.statusBar.cost.zero": "$0.00",
  "kilocode:autocomplete.statusBar.cost.lessThanCent": "<$0.01",
  "kilocode:autocomplete.toggleMessage": "smartAI Autocomplete {{status}}",
  "kilocode:autocomplete.progress.title": "smartAI",
  "kilocode:autocomplete.progress.analyzing": "Analizando tu código...",
  "kilocode:autocomplete.progress.generating": "Generando ediciones sugeridas...",
  "kilocode:autocomplete.progress.processing": "Procesando ediciones sugeridas...",
  "kilocode:autocomplete.progress.showing": "Mostrando ediciones sugeridas...",
  "kilocode:autocomplete.input.title": "smartAI: Tarea Rápida",
  "kilocode:autocomplete.input.placeholder": "ej., 'refactoriza esta función para que sea más eficiente'",
  "kilocode:autocomplete.commands.generateSuggestions": "smartAI: Generar Ediciones Sugeridas",
  "kilocode:autocomplete.commands.displaySuggestions": "Mostrar Ediciones Sugeridas",
  "kilocode:autocomplete.commands.cancelSuggestions": "Cancelar Ediciones Sugeridas",
  "kilocode:autocomplete.commands.applyCurrentSuggestion": "Aplicar Edición Sugerida Actual",
  "kilocode:autocomplete.commands.applyAllSuggestions": "Aplicar Todas las Ediciones Sugeridas",
  "kilocode:autocomplete.commands.category": "smartAI",
  "kilocode:autocomplete.codeAction.title": "smartAI: Ediciones Sugeridas",
  "kilocode:autocomplete.chatParticipant.fullName": "smartAI Agent",
  "kilocode:autocomplete.chatParticipant.name": "Agent",
  "kilocode:autocomplete.chatParticipant.description": "Puedo ayudarte con tareas rápidas y ediciones sugeridas.",
  "kilocode:autocomplete.incompatibilityExtensionPopup.message":
    "El smartAI Autocomplete está siendo bloqueado por un conflicto con GitHub Copilot. Para solucionarlo, debes desactivar las sugerencias en línea de Copilot.",
  "kilocode:autocomplete.incompatibilityExtensionPopup.disableCopilot": "Desactivar Copilot",
  "kilocode:autocomplete.incompatibilityExtensionPopup.disableInlineAssist": "Desactivar Autocomplete",
}
