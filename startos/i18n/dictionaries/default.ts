export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'History Database': 0,
  'Recording UPS readings': 1,
  'The history database is not ready': 2,
  Grafana: 3,
  'Grafana is ready': 4,
  'Grafana is not ready': 5,
  'The UPS did not answer. Trying again.': 6,
  'UPS unreachable. In System > UPS Monitor, check that a UPS is connected and "Other clients can monitor" is on. If this server has no UPS Monitor, choose Another NUT server in Configure UPS.': 7,
  'UPS unreachable at ${host}. Check the address in Configure UPS and that the NUT server accepts network clients.': 8,
  'On battery.': 9,
  'On wall power.': 10,
  // interfaces.ts
  'UPS history charts and the outage timeline, in Grafana': 11,
  // utils.ts
  'Charge ${charge}%, about ${minutes} min of runtime.': 12,
  'Charge ${charge}%.': 13,
  '${ups} is on battery': 14,
  'Wall power is out.': 15,
  '${ups} is back on wall power': 16,
  'The outage lasted about ${minutes} min.': 17,
  '${ups} battery is below ${threshold}%': 18,
  '${ups} battery has recovered': 19,
  '${ups} is unreachable': 20,
  'The UPS has stopped answering. Power alerts are paused until it answers again.': 21,
  '${ups} is reachable again': 22,
  'The UPS is answering again. Power alerts have resumed.': 23,
  // actions/configureAlerts.ts
  'Must start with http:// or https://': 24,
  'Low Battery Alert Level': 25,
  'Send an alert when the battery charge drops below this level.': 26,
  'Also Send Alerts To': 27,
  'Alerts always appear as StartOS notifications. They can also be sent to an ntfy topic or a webhook.': 28,
  'StartOS notifications only': 29,
  'Topic Address': 30,
  'The full address of the ntfy topic, for example https://ntfy.sh/my-ups-alerts': 31,
  'Access Token': 32,
  'Only needed when the topic requires a login. Leave empty otherwise.': 33,
  Webhook: 34,
  'Webhook Address': 35,
  'Each alert is sent to this address as a JSON POST request.': 36,
  'Configure Alerts': 37,
  'Set the low battery alert level and where alerts are sent.': 38,
  // actions/configureUps.ts
  'Display Name': 39,
  'The name shown for this UPS in Grafana and in alerts. Readings are recorded under this name: after a change, the charts show the old and new names as separate lines.': 40,
  'NUT Server Address': 41,
  'The IP address or host name of the machine running the NUT server.': 42,
  'Must be an IP address or a host name': 43,
  'NUT Server Port': 44,
  'UPS Name': 45,
  'The name the NUT server gives the UPS. If it is wrong, UPS Watch cannot read the UPS: charts and alerts stop. Another StartOS server always calls its UPS "startos".': 46,
  'Letters, numbers, dots, dashes and underscores only': 47,
  'Configure UPS': 48,
  'Choose which UPS to read and what to call it.': 49,
  // actions/sendTestAlert.ts
  'Send Test Alert': 50,
  'Send a test alert the same way a real one is sent, to check that alerts reach you.': 51,
  'UPS Watch test alert': 52,
  'This is a test. Alerts from UPS Watch are reaching you.': 53,
  'Test Alert Sent': 54,
  'A StartOS notification was created. No ntfy topic or webhook is configured.': 55,
  'The StartOS notification was created, but sending to ${url} failed: ${error}': 56,
  'A StartOS notification was created and the alert was delivered to ${url}.': 57,
  // actions/setAdminPassword.ts
  'Set Admin Password': 58,
  'Generate a new random password for the Grafana admin account. Replaces any existing password.': 59,
  'This replaces the current Grafana admin password, and the old one stops working.': 60,
  'Grafana Login': 61,
  'Sign in to Grafana with these credentials. Copy the password somewhere safe now: it is shown only once. If you lose it, run this action again to get a new one.': 62,
  Username: 63,
  Password: 64,
  // actions/setRetention.ts
  'Keep History For': 65,
  'Readings older than this are deleted. Shortening it deletes history that cannot be recovered.': 66,
  days: 67,
  'Set History Retention': 68,
  'Choose how long UPS readings are kept.': 69,
  // init/taskConfigureUps.ts
  'If this server has System > UPS Monitor, first turn on "Other clients can monitor" there, or UPS Watch cannot read the UPS. If it has no UPS Monitor, choose Another NUT server here. Then confirm the UPS settings.': 70,
  // init/watchCredentials.ts
  'Create the login for Grafana': 71,
  // actions/configureUps.ts (location)
  'UPS Location': 72,
  'Read the UPS connected to this server, or a UPS served by a NUT server on another machine.': 73,
  'This server': 74,
  'Another NUT server': 75,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
