import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './ui/Navbar.jsx'
import { Sidebar } from './ui/Sidebar.jsx'

export function AdminShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100">
      <Navbar onMenuToggle={() => setSidebarOpen((open) => !open)} />
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 xl:grid-cols-[280px_minmax(0,1fr)] xl:px-6">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="space-y-6">{children ?? <Outlet />}</main>
      </div>
    </div>
  )
}
