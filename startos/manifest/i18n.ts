export const short = {
  en_US: 'History charts and power alerts for the UPS your server monitors',
  es_ES:
    'Gráficos históricos y alertas de energía del SAI que supervisa tu servidor',
  de_DE:
    'Verlaufsdiagramme und Stromwarnungen für die USV, die Ihr Server überwacht',
  pl_PL:
    'Wykresy historii i alerty zasilania dla UPS-a monitorowanego przez serwer',
  fr_FR:
    "Graphiques d'historique et alertes pour l'onduleur surveillé par votre serveur",
}

export const long = {
  en_US:
    "UPS Watch adds history and alerts to the UPS Monitor built into StartOS. It reads the uninterruptible power supply (UPS) your server already monitors and records battery charge, runtime, load and input voltage, so you can look back over days and weeks and see every power outage on a timeline. It sends a StartOS notification when the UPS switches to battery, when wall power returns, when the charge drops below a level you choose, and when the UPS stops answering. Alerts can also go to an ntfy topic or a webhook. Charts are shown in Grafana, with Prometheus storing the history. StartOS's own UPS Monitor still handles the safe shutdown; UPS Watch only reads.",
  es_ES:
    'UPS Watch añade historial y alertas al Monitor de SAI integrado en StartOS. Lee el sistema de alimentación ininterrumpida (SAI) que tu servidor ya supervisa y registra la carga de la batería, la autonomía, la carga conectada y el voltaje de entrada, para que puedas revisar días y semanas y ver cada corte de energía en una línea de tiempo. Envía una notificación de StartOS cuando el SAI pasa a batería, cuando vuelve la corriente, cuando la carga baja de un nivel que tú eliges y cuando el SAI deja de responder. Las alertas también pueden enviarse a un tema de ntfy o a un webhook. Los gráficos se muestran en Grafana y Prometheus almacena el historial. El Monitor de SAI de StartOS sigue encargándose del apagado seguro; UPS Watch solo lee.',
  de_DE:
    'UPS Watch ergänzt die in StartOS integrierte USV-Überwachung um Verlauf und Warnungen. Es liest die unterbrechungsfreie Stromversorgung (USV), die Ihr Server bereits überwacht, und zeichnet Akkuladung, Laufzeit, Last und Eingangsspannung auf, sodass Sie Tage und Wochen zurückblicken und jeden Stromausfall auf einer Zeitleiste sehen können. Es sendet eine StartOS-Benachrichtigung, wenn die USV auf Akku umschaltet, wenn der Netzstrom zurückkehrt, wenn die Ladung unter einen von Ihnen gewählten Wert fällt und wenn die USV nicht mehr antwortet. Warnungen können auch an ein ntfy-Thema oder einen Webhook gehen. Die Diagramme werden in Grafana angezeigt, Prometheus speichert den Verlauf. Das sichere Herunterfahren übernimmt weiterhin die USV-Überwachung von StartOS; UPS Watch liest nur.',
  pl_PL:
    'UPS Watch dodaje historię i alerty do Monitora UPS wbudowanego w StartOS. Odczytuje zasilacz awaryjny (UPS), który serwer już monitoruje, i zapisuje poziom naładowania akumulatora, czas podtrzymania, obciążenie oraz napięcie wejściowe, dzięki czemu można przejrzeć dni i tygodnie wstecz i zobaczyć każdą przerwę w zasilaniu na osi czasu. Wysyła powiadomienie StartOS, gdy UPS przełącza się na akumulator, gdy wraca zasilanie sieciowe, gdy poziom naładowania spada poniżej wybranej wartości i gdy UPS przestaje odpowiadać. Alerty mogą też trafiać do tematu ntfy lub na webhook. Wykresy są wyświetlane w Grafanie, a historię przechowuje Prometheus. Bezpiecznym wyłączaniem nadal zajmuje się Monitor UPS w StartOS; UPS Watch tylko odczytuje dane.',
  fr_FR:
    "UPS Watch ajoute l'historique et les alertes à la Surveillance de l’onduleur intégrée à StartOS. Il lit l'onduleur que votre serveur surveille déjà et enregistre la charge de la batterie, l'autonomie, la charge connectée et la tension d'entrée, afin que vous puissiez revenir sur des jours et des semaines et voir chaque coupure de courant sur une chronologie. Il envoie une notification StartOS lorsque l'onduleur passe sur batterie, lorsque le courant revient, lorsque la charge descend sous un niveau que vous choisissez et lorsque l'onduleur ne répond plus. Les alertes peuvent aussi être envoyées vers un sujet ntfy ou un webhook. Les graphiques sont affichés dans Grafana et Prometheus conserve l'historique. La Surveillance de l’onduleur de StartOS continue de gérer l'arrêt sécurisé ; UPS Watch se contente de lire.",
}
