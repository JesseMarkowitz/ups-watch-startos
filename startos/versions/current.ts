import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '13.3.1:0',
  releaseNotes: {
    en_US:
      'Initial release: history charts, an outage timeline and power alerts for the UPS your StartOS server monitors.',
    es_ES:
      'Versión inicial: gráficos históricos, línea de tiempo de cortes y alertas de energía para el SAI que supervisa tu servidor StartOS.',
    de_DE:
      'Erstveröffentlichung: Verlaufsdiagramme, eine Ausfall-Zeitleiste und Stromwarnungen für die USV, die Ihr StartOS-Server überwacht.',
    pl_PL:
      'Pierwsze wydanie: wykresy historii, oś czasu przerw w zasilaniu i alerty zasilania dla UPS-a monitorowanego przez serwer StartOS.',
    fr_FR:
      "Version initiale : graphiques d'historique, chronologie des coupures et alertes d'alimentation pour l'onduleur surveillé par votre serveur StartOS.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
