import { setAdminPassword } from '../actions/setAdminPassword'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const watchCredentials = sdk.setupOnInit(async (effects) => {
  const passwordSet = await storeJson
    .read((s) => s.adminPasswordSet)
    .const(effects)

  if (!passwordSet) {
    await sdk.action.createOwnTask(effects, setAdminPassword, 'critical', {
      reason: i18n('Create the login for Grafana'),
    })
  }
})
