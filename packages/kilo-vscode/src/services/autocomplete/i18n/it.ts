// it runtime translations for autocomplete

export const dict = {
  "kilocode:autocomplete.statusBar.enabled": "$(kilo-logo) Autocomplete",
  "kilocode:autocomplete.statusBar.snoozed": "in pausa",
  "kilocode:autocomplete.statusBar.warning": "$(warning) Autocomplete",
  "kilocode:autocomplete.statusBar.tooltip.basic": "smartAI Autocomplete",
  "kilocode:autocomplete.statusBar.tooltip.disabled": "smartAI Autocomplete (disabilitato)",
  "kilocode:autocomplete.statusBar.tooltip.noCredits":
    "**Nessun credito nel tuo account**\n\nIl tuo account smartAI non ha crediti. Per usare l'autocompletamento, aggiungi crediti al tuo account.\n\n[Apri Impostazioni](command:kilo-code.settingsButtonClicked)",
  "kilocode:autocomplete.statusBar.tooltip.noUsableProvider":
    "**Nessun modello di autocompletamento configurato**\n\nPer abilitare l'autocompletamento, aggiungi un profilo con uno di questi provider supportati: {{providers}}.\n\n[Apri Impostazioni](command:kilo-code.settingsButtonClicked)",
  "kilocode:autocomplete.statusBar.tooltip.sessionTotal": "Costo totale della sessione:",
  "kilocode:autocomplete.statusBar.tooltip.provider": "Provider:",
  "kilocode:autocomplete.statusBar.tooltip.model": "Modello:",
  "kilocode:autocomplete.statusBar.tooltip.profile": "Profilo: ",
  "kilocode:autocomplete.statusBar.tooltip.defaultProfile": "Predefinito",
  "kilocode:autocomplete.statusBar.tooltip.completionSummary":
    "Eseguiti {{count}} completamenti tra {{startTime}} e {{endTime}}, per un costo totale di {{cost}}.",
  "kilocode:autocomplete.statusBar.tooltip.providerInfo":
    "Autocompletamenti forniti da {{model}} tramite {{provider}}.",
  "kilocode:autocomplete.statusBar.cost.zero": "$0.00",
  "kilocode:autocomplete.statusBar.cost.lessThanCent": "<$0.01",
  "kilocode:autocomplete.toggleMessage": "smartAI Autocomplete {{status}}",
  "kilocode:autocomplete.progress.title": "smartAI",
  "kilocode:autocomplete.progress.analyzing": "Analizzando il tuo codice...",
  "kilocode:autocomplete.progress.generating": "Generando modifiche suggerite...",
  "kilocode:autocomplete.progress.processing": "Elaborando modifiche suggerite...",
  "kilocode:autocomplete.progress.showing": "Mostrando modifiche suggerite...",
  "kilocode:autocomplete.input.title": "smartAI: Attività Rapida",
  "kilocode:autocomplete.input.placeholder": "es., 'refactorizza questa funzione per renderla più efficiente'",
  "kilocode:autocomplete.commands.generateSuggestions": "smartAI: Genera Modifiche Suggerite",
  "kilocode:autocomplete.commands.displaySuggestions": "Mostra Modifiche Suggerite",
  "kilocode:autocomplete.commands.cancelSuggestions": "Annulla Modifiche Suggerite",
  "kilocode:autocomplete.commands.applyCurrentSuggestion": "Applica Modifica Suggerita Corrente",
  "kilocode:autocomplete.commands.applyAllSuggestions": "Applica Tutte le Modifiche Suggerite",
  "kilocode:autocomplete.commands.category": "smartAI",
  "kilocode:autocomplete.codeAction.title": "smartAI: Modifiche Suggerite",
  "kilocode:autocomplete.chatParticipant.fullName": "smartAI Agent",
  "kilocode:autocomplete.chatParticipant.name": "Agent",
  "kilocode:autocomplete.chatParticipant.description": "Posso aiutarti con attività rapide e modifiche suggerite.",
  "kilocode:autocomplete.incompatibilityExtensionPopup.message":
    "Il smartAI Autocomplete è bloccato da un conflitto con GitHub Copilot. Per risolvere questo problema, devi disabilitare i suggerimenti in linea di Copilot.",
  "kilocode:autocomplete.incompatibilityExtensionPopup.disableCopilot": "Disabilita Copilot",
  "kilocode:autocomplete.incompatibilityExtensionPopup.disableInlineAssist": "Disabilita Autocomplete",
}
