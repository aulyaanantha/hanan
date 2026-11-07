"use client";

import { logoutAction } from "@/app/login/actions";
import { usePersonalSavingsAccess } from "@/components/AccessProvider";
import Link from "next/link";
import NavigationFeedback from "./NavigationFeedback";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  LayoutDashboard,
  WalletCards,
  UserRound,
  Landmark,
  Images,
  Ellipsis,
  X,
  CalendarHeart,
  MapPin,
  Settings,
  LogOut,
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
  {
    label: "HANAN Places",
    href: "/places",
    icon: MapPin,
  },
];

export default function Sidebar() {
  const canAccessPersonalSavings = usePersonalSavingsAccess();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const visibleItems = menuItems.filter((item) => item.href !== "/personal" || canAccessPersonalSavings);
  const dockItems = visibleItems.filter((item) => ["/", "/hanan", "/personal", "/seabank"].includes(item.href));
  const moreItems = visibleItems.filter((item) => !dockItems.includes(item));
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  const moreActive = moreItems.some((item) => isActive(item.href)) || pathname === "/settings";
  const activeIndex = isOpen || moreActive ? dockItems.length : Math.max(0, dockItems.findIndex((item) => isActive(item.href)));
  const dockCount = dockItems.length + 1;
  const indicator = useRef<HTMLElement>(null);
  const previousPosition = useRef<number | null>(null);
  const position = (activeIndex + .5) / dockCount;

  useEffect(() => {
    const element = indicator.current;
    if (!element) return;
    let previous = previousPosition.current;
    if (previous === null) {
      try {
        const saved = JSON.parse(sessionStorage.getItem('hanan-dock-position') ?? 'null');
        if (saved?.count === dockCount && typeof saved.position === 'number' && saved.position > 0 && saved.position < 1) previous = saved.position;
      } catch { /* Navigation works without browser storage. */ }
    }
    previousPosition.current = position;
    try { sessionStorage.setItem('hanan-dock-position', JSON.stringify({ count: dockCount, position })); } catch { /* Optional decoration only. */ }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (previous === null || previous === position || motion.matches || typeof element.animate !== 'function') return;
    const animation = element.animate([
      { '--dock-position': previous },
      { '--dock-position': position },
    ], { duration: 340, easing: 'cubic-bezier(.22,.8,.3,1)' });
    const onMotionChange = () => { if (motion.matches) animation.cancel(); };
    motion.addEventListener('change', onMotionChange);
    return () => { animation.cancel(); motion.removeEventListener('change', onMotionChange); };
  }, [position, dockCount]);

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

        <div className="brand-copy">
          <div className="brand-title">HANAN</div>
          <div className="brand-subtitle">Savings Tracker</div>
        </div>


        <form action={logoutAction} className="logout-mobile-form">
          <button type="submit" className="settings-mobile-button" aria-label="Logout" title="Logout">
            <LogOut size={20} strokeWidth={1.8} />
          </button>
        </form>



      </div>

      <nav id="primary-navigation" aria-label="Main navigation" className="sidebar-nav">
        {visibleItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-link"
              aria-current={
                pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`))
                  ? "page"
                  : undefined
              }
              onClick={() => setIsOpen(false)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{item.label}</span>
              <NavigationFeedback />
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
          <NavigationFeedback />
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="sidebar-link w-full text-left">
            <LogOut size={19} strokeWidth={1.8} />
            <span>Logout</span>
          </button>
        </form>
      </div>

      <div className="sidebar-footer">
        <p className="mt-6 text-center text-xs font-medium text-[var(--muted)]">
          © 2026 · Made by Anantha
        </p>
      </div>

      <div className="mobile-app-navigation">
        {isOpen && <>
          <button className="mobile-more-backdrop" type="button" aria-label="Close more menus" onClick={() => setIsOpen(false)} />
          <section className="mobile-more-panel" id="mobile-more-menu" aria-label="More menus" onKeyDown={(event) => { if (event.key === "Escape") setIsOpen(false); }}>
            <div className="mobile-more-heading"><span>Explore HANAN</span><button type="button" aria-label="Close more menus" onClick={() => setIsOpen(false)}><X size={18} /></button></div>
            {moreItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="mobile-more-link" aria-current={isActive(href) ? "page" : undefined} onClick={() => setIsOpen(false)}><Icon size={20} strokeWidth={1.8} /><span>{label}</span><NavigationFeedback /></Link>)}
            <Link href="/settings" className="mobile-more-link" aria-current={pathname === "/settings" ? "page" : undefined} onClick={() => setIsOpen(false)}><Settings size={20} strokeWidth={1.8} /><span>Settings</span><NavigationFeedback /></Link>
          </section>
        </>}
        <nav ref={indicator} className={`mobile-bottom-dock ${canAccessPersonalSavings ? "" : "mobile-bottom-dock-four"}`} aria-label="Mobile navigation" style={{ '--dock-position': position } as CSSProperties}>
          <span className="mobile-dock-indicator" aria-hidden="true" />
          {dockItems.map(({ href, label, icon: Icon }, index) => <Link key={href} href={href} className="mobile-dock-item" data-selected={activeIndex === index} aria-label={label} aria-current={isActive(href) ? "page" : undefined} onClick={() => setIsOpen(false)}>
            <span className="mobile-dock-icon"><Icon size={21} strokeWidth={1.6} /></span>
            <span className="mobile-dock-label" aria-hidden="true">{href === "/" ? "Dashboard" : href === "/hanan" ? "Savings" : href === "/personal" ? "Personal" : "SeaBank"}</span>
            <NavigationFeedback />
          </Link>)}
          <button type="button" className="mobile-dock-item" data-selected={activeIndex === dockItems.length} aria-label="More menus" aria-expanded={isOpen} aria-controls="mobile-more-menu" onClick={() => setIsOpen(!isOpen)}><span className="mobile-dock-icon"><Ellipsis size={22} strokeWidth={1.8} /></span><span className="mobile-dock-label" aria-hidden="true">More</span></button>
        </nav>
      </div>
    </aside>
  );
}
