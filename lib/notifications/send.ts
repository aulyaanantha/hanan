import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { webpush } from "@/lib/notifications/web-push";

type NotificationPayload = {
  title: string;
  body: string;
  url?: string;
};

type Person = "Anantha" | "Farhan";

export async function sendNotificationToPerson(
  person: Person,
  notification: NotificationPayload,
) {
  const supabase = createSupabaseServerClient();

  // ==========================================
  // GET ALL DEVICES BELONGING TO THIS PERSON
  // ==========================================

  const { data: devices, error } = await supabase
    .from("notification_devices")
    .select(
      "id, person, device_name, endpoint, p256dh, auth",
    )
    .eq("person", person);

  if (error) {
    console.error(
      "Failed to get notification devices:",
      error,
    );

    return {
      success: false,
      sent: 0,
      failed: 0,
    };
  }

  if (!devices || devices.length === 0) {
    console.log(
      `No notification devices found for ${person}.`,
    );

    return {
      success: true,
      sent: 0,
      failed: 0,
    };
  }

  // ==========================================
  // PREPARE NOTIFICATION PAYLOAD
  // ==========================================

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url || "/",
  });

  let sent = 0;
  let failed = 0;

  // ==========================================
  // SEND TO ALL DEVICES
  // ==========================================

  for (const device of devices) {
    try {
      await webpush.sendNotification(
        {
          endpoint: device.endpoint,
          keys: {
            p256dh: device.p256dh,
            auth: device.auth,
          },
        },
        payload,
      );

      sent++;
    } catch (error: any) {
      failed++;

      console.error(
        `Failed to send notification to ${device.device_name}:`,
        error,
      );

      // ==========================================
      // REMOVE EXPIRED / INVALID SUBSCRIPTION
      // ==========================================

      if (
        error?.statusCode === 404 ||
        error?.statusCode === 410
      ) {
        await supabase
          .from("notification_devices")
          .delete()
          .eq("id", device.id);

        console.log(
          `Removed expired notification device: ${device.id}`,
        );
      }
    }
  }

  return {
    success: sent > 0 || devices.length === 0,
    sent,
    failed,
  };
}