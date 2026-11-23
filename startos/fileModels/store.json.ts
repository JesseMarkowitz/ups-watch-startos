import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const ups = z.looseObject({
  name: z.string().catch('UPS'),
  host: z.string().catch('10.0.3.1'),
  port: z.number().catch(3493),
  upsName: z.string().catch('startos'),
})

const defaultUpses = () => [ups.parse({})]

const alertTarget = z.looseObject({
  kind: z.enum(['none', 'ntfy', 'webhook']).catch('none'),
  url: z.string().optional().catch(undefined),
  token: z.string().optional().catch(undefined),
})

const shape = z.looseObject({
  adminPasswordSet: z.boolean().catch(false),
  // A list so more than one UPS can be watched later; this version reads the first.
  upses: z.array(ups).min(1).catch(defaultUpses),
  chargeThreshold: z.number().catch(30),
  retentionDays: z.number().catch(90),
  alertTarget: alertTarget.catch(() => alertTarget.parse({})),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  shape,
)
