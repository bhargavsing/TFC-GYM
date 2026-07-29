import { useQuery } from '@tanstack/react-query'
import { Card } from '../ui/Card.jsx'
import { PageHeader } from '../ui/PageHeader.jsx'
import { Button } from '../ui/Button.jsx'
import { money } from '../../utils/format.js'
import { tfcApi } from '../../api/members.js'

const defaultMembershipPlans = [
  { _id: 'default-monthly', name: 'Monthly Plan', description: 'Flexible monthly access for regular gym training.', durationDays: 30, discountedPrice: 1000 },
  { _id: 'default-quarterly', name: '3 Month Plan', description: 'Best value for consistent progress.', durationDays: 90, discountedPrice: 2500 },
  { _id: 'default-annual', name: 'Annual Elite', description: 'Commit to consistency with premium savings.', durationDays: 365, discountedPrice: 9000 },
]

export function PlansPage() {
  const plansQuery = useQuery({ queryKey: ['plans'], queryFn: tfcApi.plans })
  const plans = plansQuery.data?.length ? plansQuery.data : defaultMembershipPlans

  return (
    <main className="min-h-screen bg-[#09090B] text-slate-100">
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 xl:px-8">
        <PageHeader eyebrow="Membership" title="Premium gym memberships" description="Choose the plan that fits your community and business model." />
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan._id} className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">{plan.durationDays} days</p>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">Best choice</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{plan.description}</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-extrabold text-white">{money.format(plan.discountedPrice)}</p>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Standard pricing</p>
              </div>
              <Button variant="primary" className="w-full">Choose plan</Button>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
