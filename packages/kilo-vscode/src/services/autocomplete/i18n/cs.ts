// cs runtime translations for autocomplete

export const dict = {
  "kilocode:autocomplete.statusBar.enabled": "$(kilo-logo) Autocomplete",
  "kilocode:autocomplete.statusBar.snoozed": "pozastaveno",
  "kilocode:autocomplete.statusBar.warning": "$(warning) Autocomplete",
  "kilocode:autocomplete.statusBar.tooltip.basic": "smartAI Autocomplete",
  "kilocode:autocomplete.statusBar.tooltip.disabled": "smartAI Autocomplete (zakázáno)",
  "kilocode:autocomplete.statusBar.tooltip.noCredits":
    "**Na tvém účtu nejsou žádné kredity**\n\nTvůj účet smartAI nemá žádné kredity. Pro použití automatického doplňování prosím přidej kredity na svůj účet.\n\n[Otevřít Nastavení](command:kilo-code.settingsButtonClicked)",
  "kilocode:autocomplete.statusBar.tooltip.noUsableProvider":
    "**Není nakonfigurován žádný model automatického doplňování**\n\nPro povolení automatického doplňování přidej profil s jedním z těchto podporovaných poskytovatelů: {{providers}}.\n\n[Otevřít Nastavení](command:kilo-code.settingsButtonClicked)",
  "kilocode:autocomplete.statusBar.tooltip.sessionTotal": "Celkové náklady relace:",
  "kilocode:autocomplete.statusBar.tooltip.provider": "Poskytovatel:",
  "kilocode:autocomplete.statusBar.tooltip.model": "Model:",
  "kilocode:autocomplete.statusBar.tooltip.profile": "Profil: ",
  "kilocode:autocomplete.statusBar.tooltip.defaultProfile": "Výchozí",
  "kilocode:autocomplete.statusBar.tooltip.completionSummary":
    "Provedeno {{count}} dokončení mezi {{startTime}} a {{endTime}}, s celkovými náklady {{cost}}.",
  "kilocode:autocomplete.statusBar.tooltip.providerInfo":
    "Automatické dokončování poskytuje {{model}} přes {{provider}}.",
  "kilocode:autocomplete.statusBar.cost.zero": "$0.00",
  "kilocode:autocomplete.statusBar.cost.lessThanCent": "<$0.01",
  "kilocode:autocomplete.toggleMessage": "smartAI Autocomplete {{status}}",
  "kilocode:autocomplete.progress.title": "smartAI",
  "kilocode:autocomplete.progress.analyzing": "Analyzuji tvůj kód...",
  "kilocode:autocomplete.progress.generating": "Generuji navrhované úpravy...",
  "kilocode:autocomplete.progress.processing": "Zpracovávám navrhované úpravy...",
  "kilocode:autocomplete.progress.showing": "Zobrazuji navrhované úpravy...",
  "kilocode:autocomplete.input.title": "smartAI: Rychlý úkol",
  "kilocode:autocomplete.input.placeholder": "např. 'refaktoruj tuto funkci, aby byla efektivnější'",
  "kilocode:autocomplete.commands.generateSuggestions": "smartAI: Generovat navrhované úpravy",
  "kilocode:autocomplete.commands.displaySuggestions": "Zobrazit navrhované úpravy",
  "kilocode:autocomplete.commands.cancelSuggestions": "Zrušit navrhované úpravy",
  "kilocode:autocomplete.commands.applyCurrentSuggestion": "Použít aktuální navrhovanou úpravu",
  "kilocode:autocomplete.commands.applyAllSuggestions": "Použít všechny navrhované úpravy",
  "kilocode:autocomplete.commands.category": "smartAI",
  "kilocode:autocomplete.codeAction.title": "smartAI: Navrhované úpravy",
  "kilocode:autocomplete.chatParticipant.fullName": "smartAI Agent",
  "kilocode:autocomplete.chatParticipant.name": "Agent",
  "kilocode:autocomplete.chatParticipant.description": "Mohu ti pomoci s rychlými úkoly a navrženými úpravami.",
  "kilocode:autocomplete.incompatibilityExtensionPopup.message":
    "smartAI Autocomplete je blokováno konfliktem s GitHub Copilot. Pro vyřešení tohoto problému musíš zakázat inline návrhy Copilot.",
  "kilocode:autocomplete.incompatibilityExtensionPopup.disableCopilot": "Zakázat Copilot",
  "kilocode:autocomplete.incompatibilityExtensionPopup.disableInlineAssist": "Zakázat Autocomplete",
}
