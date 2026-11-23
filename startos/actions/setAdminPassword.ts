import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const setAdminPassword = sdk.Action.withoutInput(
  'set-admin-password',

  async ({ effects }) => ({
    name: i18n('Set Admin Password'),
    description: i18n(
      'Generate a new random password for the Grafana admin account. Replaces any existing password.',
    ),
    warning: (await storeJson.read((s) => s.adminPasswordSet).const(effects))
      ? i18n(
          'This replaces the current Grafana admin password, and the old one stops working.',
        )
      : null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const adminPassword = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 32,
    })

    // Grafana's own CLI writes the password hash into its database, creating
    // the database and the admin account when neither exists yet.
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'grafana' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'grafana',
        subpath: null,
        mountpoint: '/var/lib/grafana',
        readonly: false,
      }),
      'set-admin-password',
      async (sub) => {
        await sub.execFail(['chown', '-R', '472:0', '/var/lib/grafana'], {
          user: 'root',
        })
        await sub.execFail(
          [
            'grafana',
            'cli',
            '--homepath',
            '/usr/share/grafana',
            'admin',
            'reset-admin-password',
            adminPassword,
          ],
          { timeout: 120_000 },
        )
      },
    )
    await storeJson.merge(effects, { adminPasswordSet: true })

    return {
      version: '1',
      title: i18n('Grafana Login'),
      message: i18n(
        'Sign in to Grafana with these credentials. Copy the password somewhere safe now: it is shown only once. If you lose it, run this action again to get a new one.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: 'admin',
            masked: false,
            copyable: true,
            qr: false,
            launchable: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: adminPassword,
            masked: true,
            copyable: true,
            qr: false,
            launchable: false,
          },
        ],
      },
    }
  },
)
