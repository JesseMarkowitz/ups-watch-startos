import { sdk } from '../sdk'
import { configureAlerts } from './configureAlerts'
import { configureUps } from './configureUps'
import { sendTestAlert } from './sendTestAlert'
import { setAdminPassword } from './setAdminPassword'
import { setRetention } from './setRetention'

export const actions = sdk.Actions.of()
  .addAction(setAdminPassword)
  .addAction(configureUps)
  .addAction(configureAlerts)
  .addAction(setRetention)
  .addAction(sendTestAlert)
