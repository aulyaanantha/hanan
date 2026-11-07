import { sendPaymentReminders } from "./payment-reminder";
import { sendSpecialDateNotifications } from "./special-date";
import { checkAndSendTargetNotification } from "./target";

export async function runDailyNotifications() {
  const jobs = [
    { name: "specialDates", run: sendSpecialDateNotifications },
    { name: "paymentReminders", run: sendPaymentReminders },
    { name: "target", run: checkAndSendTargetNotification },
  ];
  const results = await Promise.allSettled(jobs.map(job => job.run()));
  const details = results.map((result, index) => {
    if (result.status === "rejected") {
      console.error("Notification job failed", { job: jobs[index].name });
      return { job: jobs[index].name, success: false, reason: "job_failed" };
    }
    return { job: jobs[index].name, success: !result.value?.pending, result: result.value ?? null };
  });
  return { success: details.every(job => job.success), jobs: details };
}
