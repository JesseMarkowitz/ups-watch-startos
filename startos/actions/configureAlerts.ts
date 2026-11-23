import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value, Variants } = sdk

const urlPattern = {
  regex: 'https?://.+',
  description: i18n('Must start with http:// or https://'),
}

const inputSpec = InputSpec.of({
  chargeThreshold: Value.number({
    name: i18n('Low Battery Alert Level'),
    description: i18n(
      'Send an alert when the battery charge drops below this level.',
    ),
    required: true,
    default: 30,
    min: 5,
    max: 95,
    step: 1,
    integer: true,
    units: '%',
  }),
  alertTarget: Value.union({
    name: i18n('Also Send Alerts To'),
    description: i18n(
      'Alerts always appear as StartOS notifications. They can also be sent to an ntfy topic or a webhook.',
    ),
    default: 'none',
    variants: Variants.of({
      none: {
        name: i18n('StartOS notifications only'),
        spec: InputSpec.of({}),
      },
      ntfy: {
        name: 'ntfy',
        spec: InputSpec.of({
          url: Value.text({
            name: i18n('Topic Address'),
            description: i18n(
              'The full address of the ntfy topic, for example https://ntfy.sh/my-ups-alerts',
            ),
            required: true,
            default: null,
            patterns: [urlPattern],
          }),
          token: Value.text({
            name: i18n('Access Token'),
            description: i18n(
              'Only needed when the topic requires a login. Leave empty otherwise.',
            ),
            required: false,
            default: null,
            masked: true,
          }),
        }),
      },
      webhook: {
        name: i18n('Webhook'),
        spec: InputSpec.of({
          url: Value.text({
            name: i18n('Webhook Address'),
            description: i18n(
              'Each alert is sent to this address as a JSON POST request.',
            ),
            required: true,
            default: null,
            patterns: [urlPattern],
          }),
        }),
      },
    }),
  }),
})

export const configureAlerts = sdk.Action.withInput(
  'configure-alerts',

  {
    name: i18n('Configure Alerts'),
    description: i18n(
      'Set the low battery alert level and where alerts are sent.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },

  inputSpec,

  async () => {
    const store = await storeJson.read().once()
    if (!store) return null
    const { kind, url, token } = store.alertTarget
    return {
      chargeThreshold: store.chargeThreshold,
      alertTarget:
        kind === 'ntfy' && url
          ? { selection: 'ntfy' as const, value: { url, token: token ?? null } }
          : kind === 'webhook' && url
            ? { selection: 'webhook' as const, value: { url } }
            : { selection: 'none' as const, value: {} },
    }
  },

  async ({ effects, input }) => {
    const target = input.alertTarget
    await storeJson.merge(effects, {
      chargeThreshold: input.chargeThreshold,
      alertTarget:
        target.selection === 'ntfy'
          ? {
              kind: 'ntfy',
              url: target.value.url,
              token: target.value.token?.trim() || undefined,
            }
          : target.selection === 'webhook'
            ? { kind: 'webhook', url: target.value.url, token: undefined }
            : { kind: 'none', url: undefined, token: undefined },
    })
  },
)
