import { ReactNode } from 'react'

import Sidebar from './Sidebar'

export default function AppShell({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Sidebar />

      <main id="main-content" className="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}