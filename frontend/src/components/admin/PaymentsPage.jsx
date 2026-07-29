import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../ui/Card.jsx'
import { PageHeader } from '../ui/PageHeader.jsx'
import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'
import { tfcApi } from '../../api/members.js'

const samplePayments = [
  { id: 'INV-1024', member: 'Sneha Rao', amount: 4200, status: 'Paid', date: '2026-07-12' },
  { id: 'INV-1038', member: 'Nikhil Verma', amount: 3000, status: 'Due', date: '2026-07-14' },
  { id: 'INV-1042', member: 'Aditi Sharma', amount: 2400, status: 'Paid', date: '2026-07-16' },
]

export function PaymentsPage() {
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const dashboardQuery = useQuery({ queryKey: ['admin-dashboard'], queryFn: tfcApi.adminDashboard, retry: false })
  const payments = dashboardQuery.data?.recentPayments ?? samplePayments

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Finance" title="Payment dashboard" description="Track revenue, invoices, and payment status with elegant SaaS visualizations." actions={[<Button key="export" variant="secondary">Export CSV</Button>]} />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_420px]">
        <div className="space-y-6">
          <Card className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Total revenue</p>
              <p className="mt-4 text-3xl font-bold text-white">₹{dashboardQuery.data?.totalRevenue ?? 12400}</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Outstanding</p>
              <p className="mt-4 text-3xl font-bold text-white">₹{dashboardQuery.data?.outstandingRevenue ?? 3800}</p>
            </div>
          </Card>
          <Card className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Recent payments</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Latest invoices</h2>
              </div>
            </div>
            <div className="grid gap-4">
              {payments.map((payment) => (
                <button key={payment.id} type="button" onClick={() => setSelectedInvoice(payment)} className="group rounded-[28px] border border-white/10 bg-slate-950/80 p-4 text-left transition hover:border-emerald-400/40 hover:bg-white/5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{payment.member}</p>
                      <p className="mt-1 text-sm text-slate-400">{payment.date} · {payment.id}</p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${payment.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-amber-500/15 text-amber-200'}`}>{payment.status}</div>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">Amount: ₹{payment.amount}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>
        <Card className="space-y-5">
          <h2 className="text-2xl font-bold text-white">Income insights</h2>
          <p className="text-sm leading-7 text-slate-300">This section uses your current membership and payment trends to highlight revenue performance.</p>
          <div className="grid gap-4">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Monthly average</p>
              <p className="mt-3 text-3xl font-bold text-white">₹{dashboardQuery.data?.monthlyAverage ?? 5100}</p>
            </div>
            <Button variant="accent" onClick={() => setSelectedInvoice(samplePayments[0])}>View sample invoice</Button>
          </div>
        </Card>
      </div>
      <Modal open={Boolean(selectedInvoice)} title="Invoice details" description={selectedInvoice?.member} onClose={() => setSelectedInvoice(null)}>
        {selectedInvoice ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">Invoice ID {selectedInvoice.id}</p>
            <p className="text-lg font-semibold text-white">Amount: ₹{selectedInvoice.amount}</p>
            <p className="text-sm text-slate-400">Status: {selectedInvoice.status}</p>
            <p className="text-sm text-slate-400">Date: {selectedInvoice.date}</p>
            <p className="text-sm leading-7 text-slate-300">This premium invoice preview shows how payments and statuses can be managed from the admin console.</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Download invoice</Button>
              <Button variant="ghost">Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
