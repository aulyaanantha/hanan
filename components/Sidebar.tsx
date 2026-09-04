import Link from 'next/link'
import {
  LayoutDashboard,
  WalletCards,
  UserRound,
  Landmark,
} from 'lucide-react'

const menuItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'HANAN Savings',
    href: '/hanan',
    icon: WalletCards,
  },
  {
    label: 'Personal Savings',
    href: '/personal',
    icon: UserRound,
  },
  {
    label: 'SeaBank Balance',
    href: '/seabank',
    icon: Landmark,
  },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">H</div>

        <div>
          <div className="brand-title">HANAN</div>
          <div className="brand-subtitle">Savings Tracker</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-link"
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-dot" />
        <span>Private App</span>
      </div>
    </aside>
  )
}