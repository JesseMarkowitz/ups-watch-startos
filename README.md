<p align="center">
  <img src="icon.svg" alt="UPS Watch Logo" width="21%">
</p>

# UPS Watch on StartOS

> Everything not listed in this document should behave the same as upstream
> Grafana, Prometheus and nut_exporter. If a feature, setting, or behavior is not
> mentioned here, the upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

UPS Watch adds history charts and alerts to the UPS Monitor built into StartOS. It is not one upstream application but three, wired together: [nut_exporter](https://github.com/DRuggeri/nut_exporter) reads the UPS from the server's NUT service, [Prometheus](https://github.com/prometheus/prometheus) stores the readings, and [Grafana](https://github.com/grafana/grafana) draws them. The alerts are sent by the package's own code, not by Grafana.

**The web interface is Grafana.** Opening the service's interface leads to Grafana's login page, titled "UPS Watch", and after sign-in to a page of UPS charts. This document calls that page "the UPS charts"; Grafana's own word for it is a dashboard, which is not the StartOS service dashboard.

The icon is the [Network UPS Tools](https://github.com/networkupstools/nut) project logo (`docs/images/nut-logo.svg`). The package license is Grafana's AGPL-3.0, the most restrictive of the three; Prometheus and nut_exporter are Apache-2.0.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

The package runs three upstream images, unmodified, each in its own subcontainer, for x86_64 and aarch64.

| Subcontainer   | Image                   | Runs                                   | Listens on       |
| -------------- | ----------------------- | -------------------------------------- | ---------------- |
| `nut-exporter` | `druggeri/nut_exporter` | image entrypoint, with a listen flag   | `127.0.0.1:9199` |
| `prometheus`   | `prom/prometheus`       | image entrypoint, with the flags below | `127.0.0.1:9090` |
| `grafana`      | `grafana/grafana`       | image entrypoint                       | port `3000`      |

The three share one network namespace, so they reach each other on `127.0.0.1`. Only Grafana's port is bound to an interface.

Start order is nut_exporter, then Prometheus, then Grafana. Two oneshots run first on every start and set volume ownership: `grafana-chown` (uid 472) and `prometheus-chown` (`nobody`).

On every start the package edits two strings in Grafana's login page script inside the running subcontainer, so the page is titled "UPS Watch" above "Welcome to Grafana". Grafana has no setting for this outside its Enterprise edition. If an update moves the strings, the edit is skipped, a warning is logged, and the page keeps Grafana's own title.

Prometheus is started with `--storage.tsdb.retention.time` taken from the retention setting and scrapes the exporter every 10 seconds.

## Volume and Data Layout

Three volumes hold all state. Nothing else persists across a restart.

| Volume       | Mounted at         | In subcontainer | Holds                                                                                        |
| ------------ | ------------------ | --------------- | -------------------------------------------------------------------------------------------- |
| `grafana`    | `/var/lib/grafana` | `grafana`       | Grafana's SQLite database: the admin account, Grafana dashboards the user made, and settings |
| `prometheus` | `/prometheus`      | `prometheus`    | The history of UPS readings                                                                  |
| `startos`    | not mounted        | none            | `store.json` and `alert-state.json` (see File Models)                                        |

The UPS charts (a Grafana dashboard), the data source and the provisioning folders are read-only package assets mounted at `/etc/grafana/provisioning` and `/etc/grafana/dashboards`. They are replaced on every update, so the shipped charts cannot be edited in place; a copy saved in Grafana lives in the `grafana` volume.

## File Models

The package owns two JSON files on the `startos` volume and generates one config file without a model.

**`store.json`** holds the package's settings. It is seeded with defaults at install and changed only by actions.

| Key                | Default                                                                     | Written by            | Effect of a change                |
| ------------------ | --------------------------------------------------------------------------- | --------------------- | --------------------------------- |
| `upses`            | one entry: name `<server>-UPS`, host `10.0.3.1`, port `3493`, UPS `startos` | Configure UPS         | restarts the daemons              |
| `retentionDays`    | `90`                                                                        | Set History Retention | restarts the daemons              |
| `chargeThreshold`  | `30`                                                                        | Configure Alerts      | read on the next poll; no restart |
| `alertTarget`      | `none`                                                                      | Configure Alerts      | read on the next poll; no restart |
| `adminPasswordSet` | `false`                                                                     | Set Admin Password    | clears the critical task          |

`upses` is a list, but only its first entry is read. At install its name is set to the server's `.local` name followed by `-UPS` (`myserver-UPS`), or to `UPS` if that name cannot be read. `alertTarget` can hold an ntfy access token in clear text. The Grafana admin password is never stored.

**`alert-state.json`** records what the alert logic last saw: on battery or not, low charge or not, unreachable or not, and when the current outage began. The package rewrites it on every state change. It is what stops a restart from repeating an alert and what lets "back on wall power" report the outage length. Deleting it while the UPS is in an abnormal state causes that state's alert to be sent again.

**`/etc/prometheus/prometheus.yml`** is written into the Prometheus subcontainer on every start from `upses`. A hand edit is lost at the next start.

Grafana is configured only through environment variables, applied on every start: telemetry, update checks, the news feed, plugin preinstall and sign-up are off; Grafana's home page is the shipped UPS charts; the empty username box on the login page shows `admin`; the deprecated `X-XSS-Protection` header is off.

## Dependencies

None. The package reads the NUT service that StartOS itself runs for **System > UPS Monitor**, which is part of the OS and not a package.

That service must be reachable. On the server that has the UPS, **Other clients can monitor** must be on: with it off, StartOS's NUT server listens on loopback only and the package's container cannot reach it. If the server is a NUT client of another machine, it runs no NUT server at all, and Configure UPS must point at that other machine.

## Network Access and Interfaces

The package exposes one interface and makes outbound connections of two kinds.

| Interface | Type | Port | Protocol | Serves                             |
| --------- | ---- | ---- | -------- | ---------------------------------- |
| `ui`      | ui   | 3000 | HTTP     | Grafana, opening on the UPS charts |

Outbound:

- To the NUT server, by default `10.0.3.1:3493`, the OS's fixed address on the container bridge. Readings need no NUT login.
- To the ntfy topic or webhook address, if one is configured, once per alert.

Service containers cannot resolve `.local` names, so a remote NUT server is addressed by IP. A server whose default outbound gateway is a tunnel cannot reach LAN addresses, which makes a LAN NUT server unreachable.

## Installation and First-Run Flow

The service cannot start until the Grafana login exists, and Grafana never runs with its default `admin`/`admin` login.

1. Install seeds `store.json` and raises two tasks (see Tasks).
2. The user runs Set Admin Password. This creates Grafana's database and its `admin` account with a generated password.
3. The service starts. Prometheus begins recording and the `ups` health check begins polling.

Grafana's own setup wizard and sign-up are not used.

## Actions

Five actions, all available whether the service is running or stopped. None is hidden.

**Set Admin Password** (`set-admin-password`)

- When: at first setup, and whenever the password is lost.
- Changes: the admin password hash in Grafana's database, through `grafana cli admin reset-admin-password` in a temporary subcontainer. Sets `adminPasswordSet`.
- Cost: a few seconds; up to a minute on first run, when it creates the database. No restart, no interruption.
- Repeat: safe, but each run replaces the password, and the old one stops working at once.
- Outputs: username `admin` and the new password. The password cannot be shown again.

**Configure UPS** (`configure-ups`)

- When: to confirm the defaults after install, to rename the UPS, or to read a UPS on another machine.
- Inputs: a display name, and a location. **This server** has no further fields: the address, port and UPS name of StartOS's own NUT server are fixed. **Another NUT server** asks for an address, a port and the UPS name on that server. A wrong UPS name there makes every read fail, which shows as the `ups` check failing and an "unreachable" alert.
- Changes: the first entry of `upses`.
- Cost: restarts all three daemons, about 15 seconds. Renaming the UPS starts a new series in the history under the new name; readings under the old name remain.
- Repeat: safe. A submit that changes nothing restarts nothing.

**Configure Alerts** (`configure-alerts`)

- When: to change the low battery level or where alerts are sent.
- Changes: `chargeThreshold` and `alertTarget`. Takes effect within 5 seconds, with no restart.
- Repeat: safe.
- Note: the address is not tested on save. Run Send Test Alert afterwards.

**Set History Retention** (`set-retention`)

- When: to keep more or less history.
- Changes: `retentionDays`.
- Cost: restarts the daemons. Shortening it makes Prometheus delete older readings, which cannot be undone.

**Send Test Alert** (`send-test-alert`)

- When: after setting up notifications or changing the alert address.
- Changes: nothing. Creates one StartOS notification and, if configured, one ntfy or webhook delivery.
- Outputs: whether the delivery succeeded. A failed delivery fails the action and reports the HTTP status or network error.
- Repeat: safe; each run sends one more test alert.

## Tasks

Two tasks are raised. Only the first blocks the service.

| Task                 | Severity  | Raised when                 | Cleared by                 | Can return                         |
| -------------------- | --------- | --------------------------- | -------------------------- | ---------------------------------- |
| `set-admin-password` | critical  | `adminPasswordSet` is false | running Set Admin Password | no, short of deleting `store.json` |
| `configure-ups`      | important | at install only             | running Configure UPS once | no                                 |

The `configure-ups` task exists to tell the user to turn on **Other clients can monitor**. Running the action clears the task whether or not the UPS is reachable; the `ups` health check is what reports that.

## Health Checks

Three checks are shown. The `ups` check is also where alerts are sent from.

| Check        | Probes                                                    | Failing means                                                           |
| ------------ | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `prometheus` | port 9090 listening                                       | Prometheus has not started; check the service log                       |
| `grafana`    | port 3000 listening, 60 s grace period                    | Grafana is still migrating its database after an update, or has crashed |
| `ups`        | one read of the UPS through the exporter, every 5 seconds | see below                                                               |

`ups` states:

- **Success**, "On wall power. Charge N%, about M min of runtime."
- **Loading**, "On battery. …" — the UPS is running on battery. This is a power outage, not a fault in the service.
- **Loading**, "The UPS did not answer. Trying again." — one or two failed reads.
- **Failure**, "UPS unreachable…" — three failed reads in a row. On the default address the usual causes are that **Other clients can monitor** is off, no UPS is connected in UPS Monitor, or the UPS's USB cable is out. On a custom address, check the address and that the NUT server accepts network clients.

Alerts are sent once per change of state:

| Alert                 | Level   | Sent when                                                              |
| --------------------- | ------- | ---------------------------------------------------------------------- |
| on battery            | warning | the UPS status gains `OB`                                              |
| back on wall power    | success | `OB` clears; reports the outage length                                 |
| battery below N%      | error   | charge falls below the threshold                                       |
| battery has recovered | info    | charge rises to the threshold plus 5 points                            |
| unreachable           | warning | three failed reads in a row; never in the first 90 seconds after start |
| reachable again       | success | the next successful read                                               |

Each is a StartOS notification and, if configured, one ntfy message or one JSON POST with the fields `event`, `level`, `title`, `message`, `ups` and `time`. A failed delivery is logged and not retried. No alert is sent while the service is stopped; a change that happened meanwhile is reported on the first poll after start.

## Backups and Restore

All three volumes are copied whole. The service is stopped during a backup, so the copies are consistent.

A restore brings back the history, the settings, the alert state and the Grafana login as they were. Nothing has to be re-entered. The period between the backup and the restore is missing from the history.

## Limitations and Differences

1. One UPS per install.
2. The NUT server's port is fixed per install, not per UPS.
3. Readings are taken without a NUT login. A NUT server that demands a login for reads is not supported.
4. Grafana's own alerting is not configured. It works if set up by hand in Grafana, but nothing connects it to StartOS notifications, and no SMTP settings are passed to Grafana.
5. The shipped UPS charts are read-only and is replaced on update.
6. Alerts depend on the server having power and a network path. For an alert to leave the building during an outage, the router and modem must also be on battery.
7. Wattage is calculated as load percentage times the UPS's nominal power, because many UPS models report no measured power. It is empty for a UPS that reports neither.
8. An ntfy server or webhook on the same StartOS server can be reached only by an address the container can resolve and whose certificate it trusts. A `.local` address does not work.

---

## Quick Reference for AI Consumers

```yaml
package_id: ups-watch
image: [grafana/grafana, prom/prometheus, druggeri/nut_exporter]
architectures: [x86_64, aarch64]
subcontainers: [grafana, prometheus, nut-exporter]
volumes:
  grafana: /var/lib/grafana
  prometheus: /prometheus
  startos: not mounted
file_models:
  - startos/store.json
  - startos/alert-state.json
startos_managed_env_vars:
  - NUT_EXPORTER_SERVER
  - NUT_EXPORTER_SERVERPORT
  - NUT_EXPORTER_VARIABLES
  - GF_ANALYTICS_REPORTING_ENABLED
  - GF_ANALYTICS_CHECK_FOR_UPDATES
  - GF_ANALYTICS_CHECK_FOR_PLUGIN_UPDATES
  - GF_ANALYTICS_FEEDBACK_LINKS_ENABLED
  - GF_NEWS_NEWS_FEED_ENABLED
  - GF_PLUGINS_PREINSTALL_DISABLED
  - GF_USERS_ALLOW_SIGN_UP
  - GF_USERS_LOGIN_HINT
  - GF_SECURITY_X_XSS_PROTECTION
  - GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH
  - GF_LOG_LEVEL
  - GF_LOG_FILTERS
dependencies: none
interfaces:
  ui: { type: ui, port: 3000 }
actions:
  - set-admin-password
  - configure-ups
  - configure-alerts
  - set-retention
  - send-test-alert
tasks:
  - { action: set-admin-password, severity: critical }
  - { action: configure-ups, severity: important }
health_checks:
  - prometheus
  - grafana
  - ups
```
