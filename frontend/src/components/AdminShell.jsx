import { Outlet } from 'react-router-dom'
import { Navbar } from './ui/Navbar.jsx'
import { Sidebar } from './ui/Sidebar.jsx'

export function AdminShell({ children }) {
  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100">
      <Navbar />
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 xl:grid-cols-[280px_minmax(0,1fr)] xl:px-6">
        <Sidebar />
        <main className="space-y-6">{children ?? <Outlet />}</main>
      </div>
    </div>
  )
}
