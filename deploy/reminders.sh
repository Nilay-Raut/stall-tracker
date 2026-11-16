#!/usr/bin/env bash
# Asks the app to send any closing-time reminders that are due. Run every 5 minutes
# by stall-reminders.timer. The call stays inside the server: the app is reached
# from within its own container, and Caddy blocks /api/cron/ from the internet.
set -euo pipefail
cd /opt/stall
docker compose exec -T app node -e '
  fetch("http://127.0.0.1:3000/api/cron/reminders", {
    method: "POST",
    headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
  })
    .then((r) => r.json().then((body) => { console.log(JSON.stringify(body)); process.exit(r.ok ? 0 : 1); }))
    .catch((e) => { console.error(e.message); process.exit(1); });
'
