import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Bell, LineChart, Users, Wallet } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../ui/Card.jsx'
import { PageHeader } from '../ui/PageHeader.jsx'
import { StatusCard } from '../ui/StatusCard.jsx'
import { Button } from '../ui/Button.jsx'
import { tfcApi } from '../../api/members.js'

const metricIcons = {
  activeMembers: <Users size={20} />,
  pendingGymPayments: <Wallet size={20} />,
  turfBookingsThisMonth: <Bell size={20} />,
  newFeedbackItems: <LineChart size={20} />,
}

export function DashboardPage() {
  const dashboardQuery = useQuery({ queryKey: ['admin-dashboard'], queryFn: tfcApi.adminDashboard, retry: false })
  const data = dashboardQuery.data ?? {}
  const chartData = data.charts?.monthlyPayments?.map((row) => ({
    name: `${row._id.month}/${row._id.year}`,
    revenue: row.total,
  })) ?? [
    { name: 'Jan', revenue: 4200 },
    { name: 'Feb', revenue: 5400 },
    { name: 'Mar', revenue: 6200 },
    { name: 'Apr', revenue: 7200 },
    { name: 'May', revenue: 8800 },
  ]

  const recentPayments = data.recentPayments ?? [
    { id: 'TX254', member: 'Ananya Patel', amount: 3200, status: 'Paid' },
    { id: 'TX258', member: 'Rohit Sharma', amount: 1500, status: 'Due' },
    { id: 'TX261', member: 'Simran Kaur', amount: 4200, status: 'Paid' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Operations dashboard" description="A premium overview of memberships, revenue, bookings, and feedback in one beautiful console." actions={[<Button key="report" variant="secondary">Export report</Button>]} />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard label="Active members" value={data.activeMembers ?? '--'} detail="Live gym membership count" icon={metricIcons.activeMembers} />
        <StatusCard label="Pending payments" value={data.pendingGymPayments ?? '--'} detail="Outstanding gym payment balance" icon={metricIcons.pendingGymPayments} />
        <StatusCard label="Turf bookings" value={data.turfBookingsThisMonth ?? '--'} detail="This month’s turf sessions" icon={metricIcons.turfBookingsThisMonth} />
        <StatusCard label="New feedback" value={data.newFeedbackItems ?? '--'} detail="Recent member suggestions" icon={metricIcons.newFeedbackItems} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Revenue</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Monthly performance</h2>
            </div>
            <div className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200">Live update</div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 20, border: 'none' }} labelStyle={{ color: '#f8fafc' }} itemStyle={{ color: '#f8fafc' }} />
                <Area type="monotone" dataKey="revenue" stroke="#22C55E" fill="url(#revenueGradient)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Recent payments</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Latest transactions</h2>
            </div>
          </div>
          <div className="grid gap-4">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="rounded-[28px] border border-white/10 bg-slate-950/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">{payment.member}</p>
                    <p className="text-sm text-slate-400">{payment.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-white">₹{payment.amount}</p>
                    <p className="text-sm text-slate-400">{payment.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
