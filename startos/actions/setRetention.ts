import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  retentionDays: Value.number({
    name: i18n('Keep History For'),
    description: i18n(
      'Readings older than this are deleted. Shortening it deletes history that cannot be recovered.',
    ),
    required: true,
    default: 90,
    min: 1,
    max: 3650,
    step: 1,
    integer: true,
    units: i18n('days'),
  }),
})

export const setRetention = sdk.Action.withInput(
  'set-retention',

  {
    name: i18n('Set History Retention'),
    description: i18n('Choose how long UPS readings are kept.'),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },

  inputSpec,

  async () => ({
    retentionDays: (await storeJson.read((s) => s.retentionDays).once()) ?? 90,
  }),

  async ({ effects, input }) => {
    await storeJson.merge(effects, { retentionDays: input.retentionDays })
  },
)
