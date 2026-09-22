"use client";

import { useEffect, useState } from "react";

type Person = "Anantha" | "Farhan";

export default function NotificationSetup() {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [registeredPerson, setRegisteredPerson] = useState<Person | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState("");

  useEffect(() => {
    const notificationSetup = localStorage.getItem("hanan_notification_setup");

    if (notificationSetup !== "true") {
      setIsVisible(true);
    }
  }, []);

  async function enableNotifications(person: Person) {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      // 1. Check browser support
      if (!("serviceWorker" in navigator)) {
        throw new Error("Browser ini belum mendukung Service Worker.");
      }

      if (!("PushManager" in window)) {
        throw new Error("Browser ini belum mendukung Push Notification.");
      }

      if (!("Notification" in window)) {
        throw new Error("Browser ini belum mendukung Notification.");
      }

      // 2. Ask notification permission
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        throw new Error(
          "Izin notifikasi ditolak. Silakan izinkan notification di pengaturan browser.",
        );
      }

      // 3. Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");

      await navigator.serviceWorker.ready;

      // 4. Get VAPID public key
      const keyResponse = await fetch("/api/notifications/public-key");

      if (!keyResponse.ok) {
        throw new Error("Gagal mengambil notification public key.");
      }

      const { publicKey } = await keyResponse.json();

      // 5. Check existing subscription
      let subscription = await registration.pushManager.getSubscription();

      // 6. Create subscription if it doesn't exist
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      // 7. Save subscription to Hanan
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          person,
          deviceName: getDeviceName(),
          subscription: subscription.toJSON(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal menyimpan perangkat.");
      }

      setMessage(`Notifikasi berhasil diaktifkan untuk ${person} 💗`);
      setRegisteredPerson(person);
      localStorage.setItem("hanan_notification_setup", "true");
      setIsVisible(false);
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  async function sendTestNotification() {
    if (!registeredPerson) {
      return;
    }

    setTestLoading(true);
    setTestMessage("");
    setError("");

    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          person: registeredPerson,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengirim test notification.");
      }

      setTestMessage(
        `Test notification berhasil dikirim ke ${registeredPerson} 🎉`,
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengirim test notification.",
      );
    } finally {
      setTestLoading(false);
    }
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="rounded-3xl bg-[#e9eef5] p-6 shadow-[8px_8px_20px_rgba(174,184,196,0.35),-8px_-8px_20px_rgba(255,255,255,0.9)]">
      <div className="text-center">
        <div className="text-3xl">🔔</div>

        <h2 className="mt-2 text-lg font-bold text-slate-700">
          Enable Notifications
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Pilih siapa yang menggunakan perangkat ini.
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => enableNotifications("Anantha")}
          className="rounded-2xl bg-[#e9eef5] px-5 py-4 text-sm font-bold text-slate-700 shadow-[5px_5px_12px_rgba(174,184,196,0.35),-5px_-5px_12px_rgba(255,255,255,0.9)] transition active:scale-[0.98] disabled:opacity-50"
        >
          💗 Anantha
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => enableNotifications("Farhan")}
          className="rounded-2xl bg-[#e9eef5] px-5 py-4 text-sm font-bold text-slate-700 shadow-[5px_5px_12px_rgba(174,184,196,0.35),-5px_-5px_12px_rgba(255,255,255,0.9)] transition active:scale-[0.98] disabled:opacity-50"
        >
          💙 Farhan
        </button>
      </div>

      {loading && (
        <p className="mt-4 text-center text-xs font-medium text-slate-400">
          Setting up notifications...
        </p>
      )}

      {message && (
        <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-center">
          <p className="text-xs font-semibold text-emerald-500">{message}</p>
        </div>
      )}

      {registeredPerson && (
        <div className="mt-4">
          <button
            type="button"
            onClick={sendTestNotification}
            disabled={testLoading}
            className="w-full rounded-2xl bg-indigo-400 px-5 py-4 text-sm font-bold text-white shadow-[5px_5px_12px_rgba(129,140,248,0.3),-3px_-3px_10px_rgba(255,255,255,0.8)] transition hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50"
          >
            {testLoading ? "Sending..." : "🔔 Send Test Notification"}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-center">
          <p className="text-xs font-semibold text-rose-400">{error}</p>
        </div>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function getDeviceName() {
  const userAgent = navigator.userAgent;

  if (/Android/i.test(userAgent)) {
    return "Android";
  }

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return "iPhone/iPad";
  }

  if (/Windows/i.test(userAgent)) {
    return "Windows";
  }

  if (/Mac/i.test(userAgent)) {
    return "Mac";
  }

  return "Unknown Device";
}
