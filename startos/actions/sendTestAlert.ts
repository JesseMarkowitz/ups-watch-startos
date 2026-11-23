import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { Alert, sendAlert, toAlertTarget } from '../utils'

export const sendTestAlert = sdk.Action.withoutInput(
  'send-test-alert',

  async () => ({
    name: i18n('Send Test Alert'),
    description: i18n(
      'Send a test alert the same way a real one is sent, to check that alerts reach you.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const store = await storeJson.read().once()
    const alert: Alert = {
      event: 'test',
      level: 'info',
      ups: store?.upses[0].name ?? 'UPS',
      title: i18n('UPS Watch test alert'),
      message: i18n('This is a test. Alerts from UPS Watch are reaching you.'),
    }
    await sdk.notification.create(effects, {
      level: alert.level,
      title: alert.title,
      message: alert.message,
    })

    const target = toAlertTarget(store?.alertTarget)
    if (target.kind === 'none')
      return {
        version: '1',
        title: i18n('Test Alert Sent'),
        message: i18n(
          'A StartOS notification was created. No ntfy topic or webhook is configured.',
        ),
        result: null,
      }
    try {
      await sendAlert(target, alert)
    } catch (e) {
      throw new Error(
        i18n(
          'The StartOS notification was created, but sending to ${url} failed: ${error}',
          {
            url: target.url,
            error: e instanceof Error ? e.message : String(e),
          },
        ),
      )
    }
    return {
      version: '1',
      title: i18n('Test Alert Sent'),
      message: i18n(
        'A StartOS notification was created and the alert was delivered to ${url}.',
        { url: target.url },
      ),
      result: null,
    }
  },
)
