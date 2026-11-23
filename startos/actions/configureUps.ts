import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { isLocalUps, localUps } from '../utils'

const { InputSpec, Value, Variants } = sdk

const inputSpec = InputSpec.of({
  name: Value.text({
    name: i18n('Display Name'),
    description: i18n(
      'The name shown for this UPS in Grafana and in alerts. Readings are recorded under this name: after a change, the charts show the old and new names as separate lines.',
    ),
    required: true,
    default: 'UPS',
  }),
  location: Value.union({
    name: i18n('UPS Location'),
    description: i18n(
      'Read the UPS connected to this server, or a UPS served by a NUT server on another machine.',
    ),
    default: 'local',
    variants: Variants.of({
      // Nothing to enter: StartOS fixes the address, port and UPS name of its own NUT server.
      local: { name: i18n('This server'), spec: InputSpec.of({}) },
      remote: {
        name: i18n('Another NUT server'),
        spec: InputSpec.of({
          host: Value.text({
            name: i18n('NUT Server Address'),
            description: i18n(
              'The IP address or host name of the machine running the NUT server.',
            ),
            required: true,
            default: null,
            patterns: [
              {
                regex: '[A-Za-z0-9.:_-]+',
                description: i18n('Must be an IP address or a host name'),
              },
            ],
          }),
          port: Value.number({
            name: i18n('NUT Server Port'),
            description: null,
            required: true,
            default: localUps.port,
            min: 1,
            max: 65535,
            step: 1,
            integer: true,
          }),
          upsName: Value.text({
            name: i18n('UPS Name'),
            description: i18n(
              'The name the NUT server gives the UPS. If it is wrong, UPS Watch cannot read the UPS: charts and alerts stop. Another StartOS server always calls its UPS "startos".',
            ),
            required: true,
            default: localUps.upsName,
            patterns: [
              {
                regex: '[A-Za-z0-9._-]+',
                description: i18n(
                  'Letters, numbers, dots, dashes and underscores only',
                ),
              },
            ],
          }),
        }),
      },
    }),
  }),
})

export const configureUps = sdk.Action.withInput(
  'configure-ups',

  {
    name: i18n('Configure UPS'),
    description: i18n('Choose which UPS to read and what to call it.'),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },

  inputSpec,

  async () => {
    const ups = await storeJson.read((s) => s.upses[0]).once()
    if (!ups) return null
    const { name, host, port, upsName } = ups
    return {
      name,
      location: isLocalUps(ups)
        ? { selection: 'local' as const, value: {} }
        : { selection: 'remote' as const, value: { host, port, upsName } },
    }
  },

  async ({ effects, input }) => {
    const rest = (await storeJson.read((s) => s.upses.slice(1)).once()) ?? []
    const { location } = input
    const ups = {
      name: input.name,
      ...(location.selection === 'remote' ? location.value : localUps),
    }
    await storeJson.merge(effects, { upses: [ups, ...rest] })
  },
)
