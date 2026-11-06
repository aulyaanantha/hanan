"use client";

import { useEffect, useState } from "react";
import { MoonStar, Sun, Sunset } from "lucide-react";
import { getJakartaGreeting } from "@/lib/login-greeting";

export default function LoginGreeting({ initialGreeting }: { initialGreeting: ReturnType<typeof getJakartaGreeting> }) {
  const [greeting, setGreeting] = useState(initialGreeting);
  useEffect(() => {
    const update = () => setGreeting(current => {
      const next = getJakartaGreeting(new Date());
      return current.period === next.period ? current : next;
    });
    const timer = window.setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, []);
  const Icon = greeting.period === "night" ? MoonStar : greeting.period === "evening" ? Sunset : Sun;
  return <p className="login-time-greeting" key={greeting.period}><Icon size={15} aria-hidden="true" /><span>{greeting.message}</span></p>;
}
