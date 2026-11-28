import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '13.3.2:0',
  releaseNotes: {
    en_US:
      'Updates Grafana to 13.3.2, which fixes two security issues. The setup task, the setup steps and the "UPS unreachable" message now also cover servers without System > UPS Monitor: there, choose Another NUT server in Configure UPS.',
    es_ES:
      'Actualiza Grafana a 13.3.2, que corrige dos problemas de seguridad. La tarea de configuración, los pasos de configuración y el mensaje «SAI inaccesible» ahora también contemplan servidores sin Sistema > Monitor de SAI: en ellos, elige Otro servidor NUT en Configurar SAI.',
    de_DE:
      'Aktualisiert Grafana auf 13.3.2, das zwei Sicherheitslücken schließt. Die Einrichtungsaufgabe, die Einrichtungsschritte und die Meldung „USV nicht erreichbar“ berücksichtigen jetzt auch Server ohne System > USV-Überwachung: Wählen Sie dort unter USV konfigurieren „Anderer NUT-Server“.',
    pl_PL:
      'Aktualizuje Grafanę do 13.3.2, która usuwa dwa problemy z bezpieczeństwem. Zadanie konfiguracji, kroki konfiguracji i komunikat „UPS nieosiągalny” obejmują teraz także serwery bez Ustawienia > Monitor UPS: na nich wybierz „Inny serwer NUT” w Konfiguruj UPS.',
    fr_FR:
      "Met à jour Grafana vers 13.3.2, qui corrige deux problèmes de sécurité. La tâche de configuration, les étapes de configuration et le message « Onduleur injoignable » couvrent désormais aussi les serveurs sans Système > Surveillance de l’onduleur : choisissez-y « Autre serveur NUT » dans Configurer l'onduleur.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
