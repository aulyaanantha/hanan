import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendNotificationToPerson } from "@/lib/notifications/send";
import {
  getNextOccurrence,
  type RepeatType,
} from "@/lib/special-dates/date-utils";

type Person = "Anantha" | "Farhan";

type SpecialDate = {
  id: string;
  title: string;
  date: string;
  type: string;
  repeat_type: RepeatType;
  is_featured: boolean;
};

type NotificationType = "day_before" | "same_day";

function getTodayJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function parseDate(dateString: string) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  );
}

function formatDateUTC(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(
  dateString: string,
  days: number,
) {
  const date = parseDate(dateString);

  date.setUTCDate(
    date.getUTCDate() + days,
  );

  return formatDateUTC(date);
}

function getDateLabel(
  dateString: string,
) {
  const date = parseDate(dateString);

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getNotificationContent(
  specialDate: SpecialDate,
  notificationType: NotificationType,
  occurrenceDate: string,
) {
  const isAnniversary =
    specialDate.type === "anniversary";

  const formattedDate =
    getDateLabel(occurrenceDate);

  if (notificationType === "day_before") {
    if (isAnniversary) {
      return {
        title: "💕 Tomorrow is Our Anniversary!",
        body: `Our Anniversary is tomorrow, ${formattedDate}. Don't forget our special day! 💗`,
      };
    }

    return {
      title: `✨ Tomorrow is ${specialDate.title}!`,
      body: `${specialDate.title} is tomorrow. Don't forget to celebrate! 💗`,
    };
  }

  if (isAnniversary) {
    return {
      title: "💕 Happy Anniversary!",
      body: "Today is Our Anniversary! Happy special day to us. 💗",
    };
  }

  return {
    title: `✨ Today is ${specialDate.title}!`,
    body: `Today is ${specialDate.title}. Don't forget to celebrate this special day! 💗`,
  };
}

export async function sendSpecialDateNotifications() {
  const supabase =
    createSupabaseServerClient();

  const today = getTodayJakarta();

  console.log(
    `Checking special dates for ${today}...`,
  );

  // ==========================================
  // GET ALL SPECIAL DATES
  // ==========================================

  const { data: specialDates, error } =
    await supabase
      .from("special_dates")
      .select(
        "id, title, date, type, repeat_type, is_featured",
      );

  if (error) {
    console.error(
      "Could not get special dates:",
      error,
    );

    return;
  }

  if (!specialDates || specialDates.length === 0) {
    console.log(
      "No special dates found.",
    );

    return;
  }

  // ==========================================
  // PROCESS EACH SPECIAL DATE
  // ==========================================

  for (const specialDate of specialDates as SpecialDate[]) {
    const occurrenceDate =
      getNextOccurrence(
        specialDate.date,
        specialDate.repeat_type,
        today,
      );

    const occurrenceDateString =
      formatDateUTC(occurrenceDate);

    const dayBefore =
      addDays(
        occurrenceDateString,
        -1,
      );

    // ========================================
    // H-1 NOTIFICATION
    // ========================================

    if (today === dayBefore) {
      await processNotification(
        supabase,
        specialDate,
        occurrenceDateString,
        "day_before",
      );
    }

    // ========================================
    // SAME DAY NOTIFICATION
    // ========================================

    if (today === occurrenceDateString) {
      await processNotification(
        supabase,
        specialDate,
        occurrenceDateString,
        "same_day",
      );
    }

    // ========================================
    // H+3 AUTO DELETE
    // ========================================

    if (
      specialDate.repeat_type === "none"
    ) {
      const deleteDate =
        addDays(
          specialDate.date,
          3,
        );

      if (today === deleteDate) {
        const { error: deleteError } =
          await supabase
            .from("special_dates")
            .delete()
            .eq("id", specialDate.id)
            .eq("is_featured", false);

        if (deleteError) {
          console.error(
            `Could not auto-delete ${specialDate.title}:`,
            deleteError,
          );
        } else {
          console.log(
            `Auto-deleted special date: ${specialDate.title}`,
          );
        }
      }
    }
  }
}

// ==========================================
// PROCESS NOTIFICATION
// ==========================================

async function processNotification(
  supabase: ReturnType<
    typeof createSupabaseServerClient
  >,
  specialDate: SpecialDate,
  occurrenceDate: string,
  notificationType: NotificationType,
) {
  // ========================================
  // CHECK DUPLICATE
  // ========================================

  const { data: existingNotification, error } =
    await supabase
      .from("special_date_notifications")
      .select("id")
      .eq(
        "special_date_id",
        specialDate.id,
      )
      .eq(
        "occurrence_date",
        occurrenceDate,
      )
      .eq(
        "notification_type",
        notificationType,
      )
      .maybeSingle();

  if (error) {
    console.error(
      `Could not check notification for ${specialDate.title}:`,
      error,
    );

    return;
  }

  if (existingNotification) {
    console.log(
      `Notification already sent: ${specialDate.title} - ${notificationType}`,
    );

    return;
  }

  // ========================================
  // GET NOTIFICATION CONTENT
  // ========================================

  const notification =
    getNotificationContent(
        specialDate,
        notificationType,
        occurrenceDate,
    );

  const people: Person[] = [
    "Anantha",
    "Farhan",
  ];

  let sentSuccessfully = false;

  // ========================================
  // SEND TO BOTH PEOPLE
  // ========================================

  for (const person of people) {
    try {
      const result =
        await sendNotificationToPerson(
          person,
          {
            title: notification.title,
            body: notification.body,
            url: "/special-dates",
          },
        );

      if (result.sent > 0) {
        sentSuccessfully = true;
      }
    } catch (error) {
      console.error(
        `Could not send special date notification to ${person}:`,
        error,
      );
    }
  }

  // ========================================
  // SAVE NOTIFICATION LOG
  // ========================================

  if (sentSuccessfully) {
    const { error: insertError } =
      await supabase
        .from("special_date_notifications")
        .insert({
          special_date_id:
            specialDate.id,
          occurrence_date:
            occurrenceDate,
          notification_type:
            notificationType,
        });

    if (insertError) {
      console.error(
        `Notification sent but could not save log for ${specialDate.title}:`,
        insertError,
      );
    } else {
      console.log(
        `Special date notification sent: ${specialDate.title} - ${notificationType}`,
      );
    }
  } else {
    console.log(
      `No notification device available for ${specialDate.title}.`,
    );
  }
}