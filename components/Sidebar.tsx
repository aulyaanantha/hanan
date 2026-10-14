"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  WalletCards,
  UserRound,
  Landmark,
  Images,
  Menu,
  X,
  CalendarHeart,
  Settings,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "HANAN Savings",
    href: "/hanan",
    icon: WalletCards,
  },
  {
    label: "Personal Savings",
    href: "/personal",
    icon: UserRound,
  },
  {
    label: "SeaBank Balance",
    href: "/seabank",
    icon: Landmark,
  },
  {
    label: "HANAN Memory",
    href: "/hanan-memory",
    icon: Images,
  },
  {
    label: "Special Dates",
    href: "/special-dates",
    icon: CalendarHeart,
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <img
            src="/images/hanan.jpg"
            alt="HANAN"
            className="h-full w-full rounded-full object-cover"
          />
        </div>

        <div>
          <div className="brand-title">HANAN</div>
          <div className="brand-subtitle">Savings Tracker</div>
        </div>


        {/* Settings Button: mobile only */}
        <Link
          href="/settings"
          className="settings-mobile-button"
          aria-label="Settings"
          aria-current={pathname === "/settings" ? "page" : undefined}
        >
          <Settings size={20} strokeWidth={1.8} />
        </Link>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

      </div>

      <nav className={`sidebar-nav ${isOpen ? "mobile-menu-open" : ""}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-link"
              onClick={() => setIsOpen(false)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-settings">
        <Link
          href="/settings"
          className="sidebar-link settings-link"
          aria-current={pathname === "/settings" ? "page" : undefined}
          onClick={() => setIsOpen(false)}
        >
          <Settings size={19} strokeWidth={1.8} />
          <span>Settings</span>
        </Link>
      </div>

      <div className="sidebar-footer">
        <p className="mt-6 text-center text-xs font-medium text-[var(--muted)]">
          © 2026 · Made by Anantha
        </p>
      </div>
    </aside>
  );
}