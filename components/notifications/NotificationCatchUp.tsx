"use client";
import { useEffect } from "react";

// Best-effort recovery when an authenticated user opens or returns to HANAN.
export default function NotificationCatchUp() {
  useEffect(() => {
    let running = false;
    let disposed = false;
    let lastAttempt = 0;
    const controller = new AbortController();
    const check = async () => {
      if (document.visibilityState !== "visible" || !navigator.onLine || running || disposed) return;
      if (Date.now() - lastAttempt < 60000) return;
      const key = "hanan-notification-last-check";
      try { if (Date.now() - Number(sessionStorage.getItem(key) || 0) < 15 * 60000) return; } catch { /* Optional storage. */ }
      running = true; lastAttempt = Date.now();
      try {
        const response = await fetch("/api/notifications/check", { method: "POST", signal: controller.signal });
        if (response.ok && !disposed) {
          try { sessionStorage.setItem(key, String(Date.now())); } catch { /* Optional storage. */ }
        }
      } catch { /* The next visit or backup cron can retry. */ }
      finally { running = false; }
    };
    const timer = window.setTimeout(() => void check(), 1500);
    const interval = window.setInterval(() => void check(), 60000);
    const onVisible = () => void check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => { disposed = true; clearTimeout(timer); clearInterval(interval); controller.abort(); document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("online", onVisible); };
  }, []);
  return null;
}
