import { Card } from '../ui/Card.jsx'
import { PageHeader } from '../ui/PageHeader.jsx'
import { Button } from '../ui/Button.jsx'

export function PartnersPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Partners" title="Partner network" description="Manage partner relationships, offers, and gym collaborations." actions={[<Button key="new" variant="secondary">Add partner</Button>]} />
      <Card className="space-y-4">
        <p className="text-slate-300">The partners section is preserved for compatibility and future premium extensions.</p>
      </Card>
    </div>
  )
}
