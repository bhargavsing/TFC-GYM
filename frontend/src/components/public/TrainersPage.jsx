import { useQuery } from '@tanstack/react-query'
import { Card } from '../ui/Card.jsx'
import { PageHeader } from '../ui/PageHeader.jsx'
import { Button } from '../ui/Button.jsx'
import { Badge } from '../ui/Badge.jsx'
import { tfcApi } from '../../api/members.js'

const sampleTrainers = [
  {
    id: 'coach-arjun',
    name: 'Dheeraj Adhikari',
    title: 'Performance Trainer',
    specialties: ['Strength', 'Endurance', 'Turf training'],
    hourlyRate: 1200,
    bio: 'Experienced coach focused on tactical fitness, injury prevention, and premium member transformation.',
  },
  {
    id: 'akshat-koranga',
    name: 'Akshat Koranga',
    title: 'Personal Trainer',
    specialties: ['Weight loss', 'Functional fitness', 'Premium coaching'],
    hourlyRate: 1000,
    bio: 'Trusted mentor for members who want structured plans, personal accountability and faster results.',
  },
]

export function TrainersPage() {
  const query = useQuery({ queryKey: ['trainers'], queryFn: tfcApi.trainers })
  const trainers = query.data?.length ? query.data : sampleTrainers

  return (
    <main className="min-h-screen bg-[#09090B] text-slate-100">
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 xl:px-8">
        <PageHeader
          eyebrow="Trainers"
          title="Professional fitness coaches"
          description="Browse our trainer team and discover expert support for your gym goals, turf sessions, and premium membership experience."
          actions={[<Button key="join" variant="secondary">Book a consultation</Button>]}
        />
        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          {trainers.map((trainer) => (
            <Card key={trainer._id ?? trainer.id} className="space-y-5 p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{trainer.name}</p>
                    <p className="text-sm text-slate-400">{trainer.title ?? 'Fitness coach'}</p>
                  </div>
                  <Badge variant={trainer.isActive === false ? 'warning' : 'success'}>
                    {trainer.isActive === false ? 'Offline' : 'Available'}
                  </Badge>
                </div>
                <p className="text-sm leading-7 text-slate-300">{trainer.bio ?? 'A dedicated professional guiding members through performance and recovery.'}</p>
              </div>
              <div className="grid gap-3">
                <div className="rounded-[24px] bg-slate-950/80 p-4">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Specialties</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(trainer.specialties ?? []).map((specialty) => (
                      <Badge key={specialty} variant="secondary">{specialty}</Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-[24px] bg-slate-950/80 p-4">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Hourly coaching</p>
                  <p className="mt-2 text-2xl font-semibold text-white">₹{trainer.hourlyRate ?? 0}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-slate-950/80 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Book consultation</p>
                  <a
                    href="https://rzp.io/rzp/gTywfblO"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-3xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_16px_60px_rgba(34,197,94,0.22)] transition hover:bg-emerald-300"
                  >
                    Pay consultation fee
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
