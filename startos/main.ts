import { readdir, readFile, writeFile } from 'node:fs/promises'
import { alertStateJson } from './fileModels/alertState.json'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  AlertState,
  buildAlert,
  describeReading,
  exporterPort,
  exporterVariables,
  localUps,
  pollIntervalMs,
  prometheusPort,
  readUps,
  scrapeIntervalSeconds,
  sendAlert,
  step,
  toAlertTarget,
  uiPort,
  unreachableAfter,
  Ups,
} from './utils'

/** No "unreachable" alert this soon after start: at boot the host's NUT server may still be coming up. */
const startupGraceMs = 90_000

const prometheusConfig = (upses: Ups[]) =>
  [
    'global:',
    `  scrape_interval: ${scrapeIntervalSeconds}s`,
    'scrape_configs:',
    '  - job_name: ups',
    '    metrics_path: /ups_metrics',
    '    static_configs:',
    ...upses.flatMap((ups) => [
      `      - targets: ['127.0.0.1:${exporterPort}']`,
      '        labels:',
      `          name: ${JSON.stringify(ups.name)}`,
      `          ups: ${JSON.stringify(ups.upsName)}`,
      // The exporter takes the NUT server and UPS name per scrape, as query parameters.
      `          __param_server: ${JSON.stringify(ups.host)}`,
      `          __param_ups: ${JSON.stringify(ups.upsName)}`,
    ]),
    '',
  ].join('\n')

/**
 * Put the package's name on Grafana's login page. Grafana offers no setting for
 * it outside its Enterprise edition, so this edits the two strings in the
 * page's script inside the running container. The image itself is untouched.
 * When an update moves the strings, the page just keeps Grafana's own title.
 */
async function brandLoginPage(rootfs: string) {
  const title = 'static LoginTitle="Welcome to Grafana"'
  const subtitle = 'static GetLoginSubTitle=()=>null'
  const dir = `${rootfs}/usr/share/grafana/public/build`
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.js')) continue
    const script = await readFile(`${dir}/${file}`, 'utf8')
    if (!script.includes(title) || !script.includes(subtitle)) continue
    await writeFile(
      `${dir}/${file}`,
      script
        .replace(title, 'static LoginTitle="UPS Watch"')
        .replace(subtitle, 'static GetLoginSubTitle=()=>"Welcome to Grafana"'),
    )
    return
  }
  console.warn("Login page title not found; leaving Grafana's own.")
}

export const main = sdk.setupMain(async ({ effects }) => {
  const config = await storeJson
    .read((s) => ({ upses: s.upses, retentionDays: s.retentionDays }))
    .const(effects)
  if (!config) throw new Error('store.json is missing')
  const ups = config.upses[0]

  const grafanaSub = sdk.SubContainer.of(
    effects,
    { imageId: 'grafana' },
    sdk.Mounts.of()
      .mountVolume({
        volumeId: 'grafana',
        subpath: null,
        mountpoint: '/var/lib/grafana',
        readonly: false,
      })
      .mountAssets({
        subpath: 'grafana/provisioning',
        mountpoint: '/etc/grafana/provisioning',
      })
      .mountAssets({
        subpath: 'grafana/dashboards',
        mountpoint: '/etc/grafana/dashboards',
      }),
    'grafana',
  )
  await brandLoginPage(await grafanaSub.rootfs).catch((e) =>
    console.warn('Could not title the login page', e),
  )

  const prometheusSub = sdk.SubContainer.of(
    effects,
    { imageId: 'prometheus' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'prometheus',
      subpath: null,
      mountpoint: '/prometheus',
      readonly: false,
    }),
    'prometheus',
  )
  await writeFile(
    `${await prometheusSub.rootfs}/etc/prometheus/prometheus.yml`,
    prometheusConfig(config.upses),
  )

  let alertState: AlertState = (await alertStateJson.read().once()) ?? {
    onBattery: false,
    chargeLow: false,
    unreachable: false,
    failures: 0,
    outageStart: null,
  }
  const startedAt = Date.now()

  return sdk.Daemons.of(effects)
    .addOneshot('grafana-chown', {
      subcontainer: grafanaSub,
      exec: {
        command: ['chown', '-R', '472:0', '/var/lib/grafana'],
        user: 'root',
      },
      requires: [],
    })
    .addOneshot('prometheus-chown', {
      subcontainer: prometheusSub,
      exec: {
        command: ['chown', '-R', 'nobody:nobody', '/prometheus'],
        user: 'root',
      },
      requires: [],
    })
    .addDaemon('nut-exporter', {
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'nut-exporter' },
        sdk.Mounts.of(),
        'nut-exporter',
      ),
      exec: {
        command: sdk.useEntrypoint([
          `--web.listen-address=127.0.0.1:${exporterPort}`,
          '--log.level=warn',
        ]),
        env: {
          NUT_EXPORTER_SERVER: ups.host,
          NUT_EXPORTER_SERVERPORT: String(ups.port),
          NUT_EXPORTER_VARIABLES: exporterVariables,
        },
      },
      ready: {
        display: null,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, exporterPort, {
            successMessage: 'The UPS reader is ready',
            errorMessage: 'The UPS reader is not ready',
          }),
      },
      requires: [],
    })
    .addDaemon('prometheus', {
      subcontainer: prometheusSub,
      exec: {
        command: sdk.useEntrypoint([
          '--config.file=/etc/prometheus/prometheus.yml',
          '--storage.tsdb.path=/prometheus',
          `--storage.tsdb.retention.time=${config.retentionDays}d`,
          `--web.listen-address=127.0.0.1:${prometheusPort}`,
          '--log.level=warn',
        ]),
      },
      ready: {
        display: i18n('History Database'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, prometheusPort, {
            successMessage: i18n('Recording UPS readings'),
            errorMessage: i18n('The history database is not ready'),
          }),
      },
      requires: ['prometheus-chown', 'nut-exporter'],
    })
    .addDaemon('grafana', {
      subcontainer: grafanaSub,
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          GF_ANALYTICS_REPORTING_ENABLED: 'false',
          GF_ANALYTICS_CHECK_FOR_UPDATES: 'false',
          GF_ANALYTICS_CHECK_FOR_PLUGIN_UPDATES: 'false',
          GF_ANALYTICS_FEEDBACK_LINKS_ENABLED: 'false',
          GF_NEWS_NEWS_FEED_ENABLED: 'false',
          GF_PLUGINS_PREINSTALL_DISABLED: 'true',
          GF_USERS_ALLOW_SIGN_UP: 'false',
          // Shown in the empty username box on the login page.
          GF_USERS_LOGIN_HINT: 'admin',
          // Grafana warns at every start while this deprecated header is on.
          GF_SECURITY_X_XSS_PROTECTION: 'false',
          GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH:
            '/etc/grafana/dashboards/ups.json',
          GF_LOG_LEVEL: 'warn',
          // Warns every 15 seconds that it found no app plugins to index.
          GF_LOG_FILTERS: 'search-manifest-watcher:error',
        },
      },
      ready: {
        display: i18n('Grafana'),
        // Grafana migrates its database on the first start after an update.
        gracePeriod: 60_000,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('Grafana is ready'),
            errorMessage: i18n('Grafana is not ready'),
          }),
      },
      requires: ['grafana-chown', 'prometheus'],
    })
    .addHealthCheck('ups', {
      ready: {
        display: 'UPS',
        trigger: sdk.trigger.statusTrigger(pollIntervalMs, {
          failure: 2 * pollIntervalMs,
        }),
        fn: async () => {
          const reading = await readUps(ups)
          const store = await storeJson.read().once()
          const threshold = store?.chargeThreshold ?? 30

          const { state, events } = step(
            alertState,
            reading,
            threshold,
            new Date(),
          )
          const changed = JSON.stringify(state) !== JSON.stringify(alertState)
          alertState = state

          const settling = Date.now() - startedAt < startupGraceMs
          for (const event of events) {
            if (event.kind === 'unreachable' && settling) {
              // Stay un-alerted so the alert goes out once the grace period ends.
              alertState = { ...alertState, unreachable: false }
              continue
            }
            const alert = buildAlert(event, ups.name, threshold)
            await sdk.notification
              .create(effects, {
                level: alert.level,
                title: alert.title,
                message: alert.message,
              })
              .catch((e) => console.error('notification failed', e))
            await sendAlert(toAlertTarget(store?.alertTarget), alert).catch(
              (e) => console.error('alert delivery failed', e),
            )
          }
          if (changed)
            await alertStateJson
              .merge(effects, alertState)
              .catch((e) => console.error('saving alert state failed', e))

          if (!reading)
            return alertState.failures < unreachableAfter
              ? {
                  result: 'loading',
                  message: i18n('The UPS did not answer. Trying again.'),
                }
              : {
                  result: 'failure',
                  message:
                    ups.host === localUps.host
                      ? i18n(
                          'UPS unreachable. In System > UPS Monitor, check that a UPS is connected and "Other clients can monitor" is on.',
                        )
                      : i18n(
                          'UPS unreachable at ${host}. Check the address in Configure UPS and that the NUT server accepts network clients.',
                          { host: ups.host },
                        ),
                }

          const detail = describeReading(reading)
          return reading.onBattery
            ? {
                result: 'loading',
                message: `${i18n('On battery.')} ${detail}`.trim(),
              }
            : {
                result: 'success',
                message: `${i18n('On wall power.')} ${detail}`.trim(),
              }
        },
      },
      requires: ['nut-exporter'],
    })
})
