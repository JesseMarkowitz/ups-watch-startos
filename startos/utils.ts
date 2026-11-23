import { T } from '@start9labs/start-sdk'
import { i18n } from './i18n'
import { sdk } from './sdk'

export const uiPort = 3000
export const prometheusPort = 9090
export const exporterPort = 9199

/** Seconds between Prometheus scrapes. The "time on battery" chart assumes it. */
export const scrapeIntervalSeconds = 10

/** NUT variables the exporter publishes; its own default omits runtime and nominal power. */
export const exporterVariables = [
  'battery.charge',
  'battery.charge.low',
  'battery.runtime',
  'battery.runtime.low',
  'battery.voltage',
  'input.voltage',
  'output.voltage',
  'ups.load',
  'ups.realpower.nominal',
  'ups.status',
].join(',')

/** Charge must climb this far above the threshold before a second low-charge alert can fire. */
export const chargeHysteresis = 5
/** Consecutive failed reads before the UPS counts as unreachable. */
export const unreachableAfter = 3
export const pollIntervalMs = 5_000

export type Ups = { name: string; host: string; port: number; upsName: string }

/** The NUT server StartOS runs for its own UPS, as a service container reaches it. */
export const localUps = { host: '10.0.3.1', port: 3493, upsName: 'startos' }

export const isLocalUps = (ups: Omit<Ups, 'name'>) =>
  ups.host === localUps.host &&
  ups.port === localUps.port &&
  ups.upsName === localUps.upsName

/**
 * "<server>-UPS", from this server's .local name. StartOS gives a package no
 * other way to learn what the server is called.
 */
export async function defaultUpsName(effects: T.Effects): Promise<string> {
  const mdns = await sdk.host
    .getOwn(effects, 'ui', (host) =>
      host
        ? Object.values(host.bindings)
            .flatMap((b) => Object.values(b.interfaces))
            .flatMap((i) => i.addressInfo.filter({ kind: 'mdns' }).hostnames)
            .map((h) => h.hostname)[0]
        : undefined,
    )
    .once()
    .catch(() => undefined)
  const server = mdns?.replace(/\.local$/, '')
  return server ? `${server}-UPS` : 'UPS'
}

export type Reading = {
  onBattery: boolean
  charge: number | null
  runtimeSeconds: number | null
  watts: number | null
}

export type AlertState = {
  onBattery: boolean
  chargeLow: boolean
  unreachable: boolean
  failures: number
  outageStart: string | null
}

export type AlertEvent =
  | { kind: 'on-battery'; reading: Reading }
  | { kind: 'power-restored'; reading: Reading; outageMinutes: number | null }
  | { kind: 'charge-low'; reading: Reading }
  | { kind: 'charge-recovered'; reading: Reading }
  | { kind: 'unreachable' }
  | { kind: 'reachable' }

export const exporterUrl = (ups: Ups) =>
  `http://127.0.0.1:${exporterPort}/ups_metrics?ups=${encodeURIComponent(ups.upsName)}&server=${encodeURIComponent(ups.host)}`

/** Reads one UPS through the exporter. Null when the exporter cannot reach it. */
export async function readUps(ups: Ups): Promise<Reading | null> {
  const res = await fetch(exporterUrl(ups), {
    signal: AbortSignal.timeout(4_000),
  }).catch(() => null)
  if (!res?.ok) return null
  return parseMetrics(await res.text())
}

export function parseMetrics(text: string): Reading | null {
  const value = (pattern: RegExp) => {
    const match = text.match(pattern)
    const n = match ? Number(match[1]) : NaN
    return Number.isFinite(n) ? n : null
  }
  const metric = (name: string) =>
    value(new RegExp(`^network_ups_tools_${name} (\\S+)$`, 'm'))
  const onBattery = value(/^network_ups_tools_ups_status\{flag="OB"\} (\S+)$/m)
  if (onBattery === null) return null
  const load = metric('ups_load')
  const nominal = metric('ups_realpower_nominal')
  return {
    onBattery: onBattery === 1,
    charge: metric('battery_charge'),
    runtimeSeconds: metric('battery_runtime'),
    watts:
      load !== null && nominal !== null
        ? Math.round((load / 100) * nominal)
        : null,
  }
}

/** One poll's transition: the next alert state and the events it raises. */
export function step(
  prev: AlertState,
  reading: Reading | null,
  threshold: number,
  now: Date,
): { state: AlertState; events: AlertEvent[] } {
  const state = { ...prev }
  const events: AlertEvent[] = []

  if (!reading) {
    state.failures = prev.failures + 1
    if (state.failures >= unreachableAfter && !prev.unreachable) {
      state.unreachable = true
      events.push({ kind: 'unreachable' })
    }
    return { state, events }
  }

  state.failures = 0
  if (prev.unreachable) {
    state.unreachable = false
    events.push({ kind: 'reachable' })
  }

  if (reading.onBattery && !prev.onBattery) {
    state.onBattery = true
    state.outageStart = now.toISOString()
    events.push({ kind: 'on-battery', reading })
  } else if (!reading.onBattery && prev.onBattery) {
    state.onBattery = false
    state.outageStart = null
    const started = prev.outageStart ? Date.parse(prev.outageStart) : NaN
    events.push({
      kind: 'power-restored',
      reading,
      outageMinutes: Number.isFinite(started)
        ? Math.max(1, Math.round((now.getTime() - started) / 60_000))
        : null,
    })
  }

  if (reading.charge !== null) {
    if (reading.charge < threshold && !prev.chargeLow) {
      state.chargeLow = true
      events.push({ kind: 'charge-low', reading })
    } else if (
      reading.charge >= threshold + chargeHysteresis &&
      prev.chargeLow
    ) {
      state.chargeLow = false
      events.push({ kind: 'charge-recovered', reading })
    }
  }

  return { state, events }
}

export type AlertTarget =
  | { kind: 'none' }
  | { kind: 'ntfy'; url: string; token: string | null }
  | { kind: 'webhook'; url: string }

export type Alert = {
  event: AlertEvent['kind'] | 'test'
  level: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  ups: string
}

export function toAlertTarget(
  stored: { kind: string; url?: string; token?: string } | undefined,
): AlertTarget {
  if (stored?.kind === 'ntfy' && stored.url)
    return { kind: 'ntfy', url: stored.url, token: stored.token ?? null }
  if (stored?.kind === 'webhook' && stored.url)
    return { kind: 'webhook', url: stored.url }
  return { kind: 'none' }
}

const ntfyPriority = { success: '3', info: '3', warning: '4', error: '5' }
const ntfyTags = {
  success: 'white_check_mark',
  info: 'information_source',
  warning: 'warning',
  error: 'rotating_light',
}

/** Delivers an alert to the user's ntfy topic or webhook. Throws on a failed delivery. */
export async function sendAlert(target: AlertTarget, alert: Alert) {
  if (target.kind === 'none') return
  const signal = AbortSignal.timeout(10_000)
  const res =
    target.kind === 'ntfy'
      ? await fetch(target.url, {
          method: 'POST',
          signal,
          headers: {
            // ntfy reads header values as UTF-8 only in this RFC 2047 form.
            Title: `=?UTF-8?B?${Buffer.from(alert.title).toString('base64')}?=`,
            Priority: ntfyPriority[alert.level],
            Tags: ntfyTags[alert.level],
            ...(target.token && { Authorization: `Bearer ${target.token}` }),
          },
          body: alert.message,
        })
      : await fetch(target.url, {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...alert, time: new Date().toISOString() }),
        })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

const minutes = (seconds: number | null) =>
  seconds === null ? null : Math.round(seconds / 60)

/** "Charge 80%, about 150 min of runtime." — or less, when the UPS reports less. */
export function describeReading(reading: Reading): string {
  const runtime = minutes(reading.runtimeSeconds)
  if (reading.charge !== null && runtime !== null)
    return i18n('Charge ${charge}%, about ${minutes} min of runtime.', {
      charge: reading.charge,
      minutes: runtime,
    })
  if (reading.charge !== null)
    return i18n('Charge ${charge}%.', { charge: reading.charge })
  return ''
}

export function buildAlert(
  event: AlertEvent,
  ups: string,
  threshold: number,
): Alert {
  const base = { event: event.kind, ups }
  switch (event.kind) {
    case 'on-battery':
      return {
        ...base,
        level: 'warning',
        title: i18n('${ups} is on battery', { ups }),
        message:
          `${i18n('Wall power is out.')} ${describeReading(event.reading)}`.trim(),
      }
    case 'power-restored':
      return {
        ...base,
        level: 'success',
        title: i18n('${ups} is back on wall power', { ups }),
        message: `${
          event.outageMinutes === null
            ? ''
            : i18n('The outage lasted about ${minutes} min.', {
                minutes: event.outageMinutes,
              })
        } ${describeReading(event.reading)}`.trim(),
      }
    case 'charge-low':
      return {
        ...base,
        level: 'error',
        title: i18n('${ups} battery is below ${threshold}%', {
          ups,
          threshold,
        }),
        message: describeReading(event.reading),
      }
    case 'charge-recovered':
      return {
        ...base,
        level: 'info',
        title: i18n('${ups} battery has recovered', { ups }),
        message: describeReading(event.reading),
      }
    case 'unreachable':
      return {
        ...base,
        level: 'warning',
        title: i18n('${ups} is unreachable', { ups }),
        message: i18n(
          'The UPS has stopped answering. Power alerts are paused until it answers again.',
        ),
      }
    case 'reachable':
      return {
        ...base,
        level: 'success',
        title: i18n('${ups} is reachable again', { ups }),
        message: i18n('The UPS is answering again. Power alerts have resumed.'),
      }
  }
}
