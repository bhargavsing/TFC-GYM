import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { PageHeader } from '../ui/PageHeader.jsx'
import { Card } from '../ui/Card.jsx'
import { TextInput } from '../ui/Input.jsx'
import { Button } from '../ui/Button.jsx'
import { tfcApi } from '../../api/members.js'

const categories = [
  'TURF_QUALITY',
  'GYM_EQUIPMENT',
  'CLEANLINESS',
  'TRAINER_SUPPORT',
  'MEMBERSHIP_PRICING',
  'BOOKING_EXPERIENCE',
  'WEBSITE_EXPERIENCE',
  'OTHER',
]

export function FeedbackPage() {
  const form = useForm({ defaultValues: { name: '', email: '', phone: '', category: categories[0], rating: 5, message: '', suggestions: '', anonymous: false } })
  const mutation = useMutation({ mutationFn: tfcApi.feedback, onSuccess: () => form.reset() })

  return (
    <main className="min-h-screen bg-[#09090B] text-slate-100">
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 xl:px-8">
        <PageHeader eyebrow="Feedback" title="Share your experience" description="Send feedback on gym services, turf, trainers, and booking flow." />
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_380px]">
          <Card className="space-y-6">
            <div className="grid gap-4">
              <TextInput label="Name" id="name" {...form.register('name')} />
              <TextInput label="Email" id="email" type="email" {...form.register('email')} />
              <TextInput label="Phone" id="phone" type="tel" {...form.register('phone')} />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-200">Category</label>
                <select className="rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" {...form.register('category')}>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              <TextInput as="textarea" label="Message" id="message" {...form.register('message')} />
              <TextInput as="textarea" label="Suggestions" id="suggestions" {...form.register('suggestions')} />
              <label className="inline-flex items-center gap-3 text-sm text-slate-300">
                <input className="h-4 w-4 rounded border-white/10 bg-slate-900 text-emerald-400" type="checkbox" {...form.register('anonymous')} />
                Submit anonymously
              </label>
            </div>
            <Button type="submit" onClick={form.handleSubmit((data) => mutation.mutate(data))} className="w-full">Send feedback</Button>
            {mutation.isSuccess && <p className="rounded-3xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">Thank you! Feedback sent successfully.</p>}
            {mutation.isError && <p className="rounded-3xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{mutation.error.message}</p>}
          </Card>
          <Card className="space-y-5">
            <h2 className="text-2xl font-bold text-white">Why your feedback matters</h2>
            <p className="text-sm leading-7 text-slate-300">Every suggestion helps TFC refine gym operations, turf bookings, and member experience.</p>
            <div className="grid gap-3">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                <p className="font-semibold text-white">Faster improvements</p>
                <p className="mt-2 text-sm text-slate-400">See the updates trainers and members ask for the most.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                <p className="font-semibold text-white">Better service</p>
                <p className="mt-2 text-sm text-slate-400">Feedback helps operational teams prioritize upgrades.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
