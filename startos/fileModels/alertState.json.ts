import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.looseObject({
  onBattery: z.boolean().catch(false),
  chargeLow: z.boolean().catch(false),
  unreachable: z.boolean().catch(false),
  failures: z.number().catch(0),
  outageStart: z.string().nullable().catch(null),
})

// Written on every alert transition. Never read it with .const(): that would
// restart the service each time the UPS changes state.
export const alertStateJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'alert-state.json' },
  shape,
)
