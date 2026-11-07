# Notification delivery and recovery

No database migration or new environment variable is required for these changes.

Deploy the updated code to Vercel Production. Confirm two cron paths are registered:

- `/api/notifications/daily`: `0 0 * * *` (07:00 WIB).
- `/api/notifications/retry`: `0 1 * * *` (08:00 WIB backup).

Both use the existing `CRON_SECRET` authorization header. On Hobby, each job can run anywhere within its scheduled hour; the minute is not guaranteed. Vercel does not automatically retry failed invocations.

Special Dates, payment reminders, and target notifications run independently. Job responses contain individual results and return HTTP 503 when delivery remains incomplete. Check Vercel runtime logs for `Push result` and `Special date delivery incomplete`; these logs contain counts and internal IDs, not push credentials.

Each device gets up to three attempts for transient push-service failures. Permanent 404/410 subscriptions are removed and must be registered again through Enable Notifications. Missing devices never count as successful delivery. Special-date and target completion require successful acceptance for both partners and every remaining active device.

Opening or returning to the authenticated app after 07:00 WIB checks outstanding notifications. A successful check is limited to once per 15 minutes per tab. Failed checks can retry after one minute while the app remains visible. The background cron continues to work when the app is closed.

Existing tables retain their original schemas. Shared completion records cannot record progress per device: an incomplete shared event may resend to the partner who already received it on a later run. Stable push topics and notification tags replace queued or displayed copies instead of accumulating them, where supported by the browser. This is not an exactly-once delivery system.

Push-service acceptance is not a receipt that Android displayed the notification. Device permission, connectivity, browser subscription validity, and OS settings still matter. Existing historical completion records are not reset automatically.

On 7 November 2026, the production daily endpoint was invoked manually during diagnosis. A same-day log was recorded at 09:20 WIB and the user confirmed delivery to both Android devices. The new recovery code still requires a Production deployment to take effect.
