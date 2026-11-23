import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { defaultUpsName } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  await storeJson.merge(effects, {})
  if (kind !== 'install') return

  // A fresh install has exactly one UPS, the model's default. Name it after the server.
  const upses = await storeJson.read((s) => s.upses).once()
  if (!upses) return
  const [first, ...rest] = upses
  await storeJson.merge(effects, {
    upses: [{ ...first, name: await defaultUpsName(effects) }, ...rest],
  })
})
