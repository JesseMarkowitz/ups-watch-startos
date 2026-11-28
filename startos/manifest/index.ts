import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'ups-watch',
  title: 'UPS Watch',
  license: 'AGPL-3.0',
  packageRepo: 'https://github.com/JesseMarkowitz/ups-watch-startos',
  upstreamRepo: 'https://github.com/grafana/grafana',
  marketingUrl: 'https://networkupstools.org/',
  donationUrl: null,
  description: { short, long },
  volumes: ['grafana', 'prometheus', 'startos'],
  hardwareRequirements: {
    ram: 2 * 1024 ** 3, // 2 GiB; the service itself uses about 0.6 GiB
  },
  images: {
    grafana: {
      source: { dockerTag: 'grafana/grafana:13.3.2' },
      arch: ['x86_64', 'aarch64'],
    },
    prometheus: {
      source: { dockerTag: 'prom/prometheus:v3.16.0' },
      arch: ['x86_64', 'aarch64'],
    },
    'nut-exporter': {
      source: { dockerTag: 'druggeri/nut_exporter:3.3.0' },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
