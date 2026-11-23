# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

- Never read `alert-state.json` with `.const()`: it is rewritten on every UPS state change,
  so a reactive read would restart the service mid-outage.
- Don't store the Grafana admin password. `setAdminPassword` hands it to Grafana's CLI and
  keeps only the `adminPasswordSet` flag.
- Adding a second UPS: `store.json` already holds a list and `prometheusConfig` already
  writes one scrape target per entry. What is still single-UPS is the `ups` health check in
  `main.ts`, the `configureUps` action, and the exporter's NUT port, which is one
  process-wide setting (`NUT_EXPORTER_SERVERPORT`) with no per-scrape override.
- User-facing text never calls Grafana or its UPS page "the dashboard": on StartOS that word
  means the service dashboard. Say "Grafana" or "the UPS charts".
- `brandLoginPage` in `main.ts` matches two exact strings in Grafana's minified login script.
  After a Grafana bump, open the login page and confirm it still says "UPS Watch".
- The "Time on battery" panel multiplies samples by `scrapeIntervalSeconds`.
  Change one and you must change the other in `assets/grafana/dashboards/ups.json`.
- To exercise alerts without a real outage, point Configure UPS at a simulated NUT server
  instead of unplugging anything. Never run `upsmon -c fsd` on a test server: a forced
  shutdown can cut the UPS outlets.
