import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { webpush } from "@/lib/notifications/web-push";

type NotificationPayload = { title: string; body: string; url?: string; tag?: string };
type Person = "Anantha" | "Farhan";
type DeliveryResult = { success: boolean; sent: number; failed: number; expired: number; reason?: string };

export async function sendNotificationToPerson(person: Person, notification: NotificationPayload): Promise<DeliveryResult> {
  const supabase = createSupabaseServerClient();
  const { data: devices, error } = await supabase.from("notification_devices")
    .select("id, person, device_name, endpoint, p256dh, auth").eq("person", person);
  if (error || !devices?.length) {
    console.warn("Push not sent", { person, reason: error ? "device_query_failed" : "no_devices" });
    return { success: false, sent: 0, failed: 0, expired: 0, reason: error ? "device_query_failed" : "no_devices" };
  }
  const payload = JSON.stringify({ ...notification, url: notification.url || "/" });
  const topic = createHash("sha256").update(notification.tag || randomUUID()).digest("base64url").slice(0, 32);
  const outcomes = await Promise.all(devices.map(async device => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await webpush.sendNotification({ endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } }, payload,
          { TTL: 86400, urgency: "high", timeout: 5000, topic });
        return "sent";
      } catch (caught: unknown) {
        const status = typeof caught === "object" && caught !== null && "statusCode" in caught ? Number(caught.statusCode) : 0;
        if (status === 404 || status === 410) {
          const { error: deleteError } = await supabase.from("notification_devices").delete().eq("id", device.id);
          if (deleteError) console.error("Could not remove expired push subscription", { person, deviceId: device.id });
          return "expired";
        }
        const temporary = status === 0 || status === 408 || status === 429 || status >= 500;
        if (!temporary || attempt === 2) {
          console.error("Push delivery failed", { person, deviceId: device.id, status, attempts: attempt + 1 });
          return "failed";
        }
        await new Promise(resolve => setTimeout(resolve, 250 * 2 ** attempt));
      }
    }
    return "failed";
  }));
  const sent = outcomes.filter(value => value === "sent").length;
  const failed = outcomes.filter(value => value === "failed").length;
  const expired = outcomes.filter(value => value === "expired").length;
  const success = sent > 0 && failed === 0;
  console.info("Push result", { person, sent, failed, expired, success });
  return { success, sent, failed, expired };
}
