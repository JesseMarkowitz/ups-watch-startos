# UPS Watch

UPS Watch shows its charts in **Grafana**. Opening the service's **Grafana** interface takes you to a Grafana login page titled "UPS Watch".

UPS Watch only reads the UPS. Safe shutdown stays with StartOS's own **UPS Monitor**, which must be set up first.

## Documentation

- [Grafana dashboards](https://grafana.com/docs/grafana/latest/dashboards/) — how to use, zoom, and customize the charts.
- [nut_exporter README](https://github.com/DRuggeri/nut_exporter/blob/master/README.md) — the component that reads the UPS, and the readings it can provide.
- [NUT variable names](https://github.com/networkupstools/nut/blob/master/docs/nut-names.txt) — what each UPS reading and status code means.
- [ntfy publishing](https://github.com/binwiederhier/ntfy/blob/main/docs/publish.md) — how ntfy topics, priorities and access tokens work.

## What you get on StartOS

- **UPS charts in Grafana** showing live status, charts of battery charge, runtime, load and input voltage, and a timeline of every power outage.
- **Alerts** as StartOS notifications when the UPS switches to battery, when wall power returns, when the charge drops below a level you choose, and when the UPS stops answering. Alerts can also be sent to an ntfy topic or a webhook.
- **A status line** on the service dashboard, such as "On wall power. Charge 100%, about 225 min of runtime."

## Getting set up

First, in StartOS under **System**:

1. Open **System > UPS Monitor** and connect your UPS if you have not already.
2. In the same place, turn on **Other clients can monitor**. UPS Watch cannot read the UPS without it.

Then, on the UPS Watch service dashboard:

3. Run **Set Admin Password**. It shows the username and a new password for Grafana. Copy the password somewhere safe: it is shown only once.
4. Start the service. Within a few seconds the **UPS** line shows the current charge and runtime.
5. Run **Configure UPS** and confirm the settings. The defaults read the UPS connected to this server and name it after the server.
6. Open the **Grafana** interface and sign in.

> **Other clients can monitor** opens the UPS readings (port 3493) to every network this server is on. The readings need no password; the password shown in UPS Monitor only protects shutdown coordination. Turn it on only on networks you trust.

## Using UPS Watch

### Charts in Grafana

Grafana opens on the UPS charts. The top row shows the current state. Below it are the outage timeline and the history charts. Use the time picker at the top right to look back over days or weeks. The charts are read-only; to build your own, save a copy in Grafana.

### Alerts

Alerts always appear in StartOS notifications. To receive them on a phone when you are away, turn on browser notifications in StartOS, or run **Configure Alerts** and add an ntfy topic or a webhook.

For an alert to reach you during an outage, your router and modem must also be on battery power.

If you publish Grafana through a tunnel to keep your home IP address private, send the service's outbound traffic through that tunnel too. Otherwise the ntfy server or webhook you send alerts to sees your home IP address. If you use the tunnel for another reason, there is nothing to change.

### Actions

- **Set Admin Password** — creates the Grafana login, or replaces the password if you have lost it. The password is shown only once.
- **Configure UPS** — chooses which UPS to read and what to call it. **This server** needs nothing more. To watch a UPS connected to another machine, choose **Another NUT server** and enter that machine's IP address and the UPS's name there; a wrong name stops the charts and alerts. On another StartOS server, turn on **Other clients can monitor** there first. Changing the display name later splits the charts into an old and a new line.
- **Configure Alerts** — sets the low battery alert level and adds an ntfy topic or webhook.
- **Set History Retention** — how long readings are kept. Shortening it deletes older history for good.
- **Send Test Alert** — sends a test alert the same way a real one is sent. Run it after changing where alerts go.

### Testing with a real outage

To test, unplug the UPS from the wall, never the server's power cord. Check first what else is plugged into the UPS. Plug it back in well before the battery runs low: when StartOS shuts down on a low battery, the UPS may cut power to everything connected to it.
