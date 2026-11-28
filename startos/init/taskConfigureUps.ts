import { configureUps } from '../actions/configureUps'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const taskConfigureUps = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return
  await sdk.action.createOwnTask(effects, configureUps, 'important', {
    reason: i18n(
      'If this server has System > UPS Monitor, first turn on "Other clients can monitor" there, or UPS Watch cannot read the UPS. If it has no UPS Monitor, choose Another NUT server here. Then confirm the UPS settings.',
    ),
  })
})
