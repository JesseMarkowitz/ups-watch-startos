# Updating the upstream version

UPS Watch pins three prebuilt Docker images by tag in `startos/manifest/index.ts`. Grafana
is the upstream the package version follows: the package version is Grafana's version plus
a downstream revision. A bump of Prometheus or nut_exporter alone raises only the
downstream revision.

## Determining the upstream version

### Grafana

- Pin: `images.grafana.source.dockerTag` (`grafana/grafana:<version>`).
- Latest: `gh release view -R grafana/grafana --json tagName -q .tagName`. Grafana also
  publishes patch releases on older minor lines, so take the highest version, not the most
  recently published.

### Prometheus

- Pin: `images.prometheus.source.dockerTag` (`prom/prometheus:v<version>`).
- Latest: `gh release view -R prometheus/prometheus --json tagName -q .tagName`.

### nut_exporter

- Pin: `images['nut-exporter'].source.dockerTag` (`druggeri/nut_exporter:<version>`).
- Latest: `gh release view -R DRuggeri/nut_exporter --json tagName -q .tagName`. The repo
  also tags Helm chart releases (`helm-nut-exporter-*`); ignore those.

## Applying the bump

### Grafana

Edit the tag in `images.grafana.source.dockerTag`. The Docker tag has no leading `v`; the
GitHub release tag does. Set the package version in `startos/versions/current.ts` to the
same Grafana version with downstream revision `0`.

`startos/actions/setAdminPassword.ts` runs `grafana cli admin reset-admin-password`, and
`startos/main.ts` sets `GF_*` environment variables. Check both against the release notes
of a new Grafana major version.

### Prometheus

Edit the tag in `images.prometheus.source.dockerTag`, keeping the leading `v`.

### nut_exporter

Edit the tag in `images['nut-exporter'].source.dockerTag`. The Docker tag has no leading
`v`; the GitHub release tag does. `startos/utils.ts` parses the exporter's metric names
(`network_ups_tools_*`), and `assets/grafana/dashboards/ups.json` queries them, so a
release that renames metrics needs both updated.
