import { configureUps } from '../actions/configureUps'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const taskConfigureUps = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return
  await sdk.action.createOwnTask(effects, configureUps, 'important', {
    reason: i18n(
      'First turn on "Other clients can monitor" in System > UPS Monitor, or UPS Watch cannot read the UPS. Then confirm the UPS settings here.',
    ),
  })
})
