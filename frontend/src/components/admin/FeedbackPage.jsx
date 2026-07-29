import { Card } from '../ui/Card.jsx'
import { PageHeader } from '../ui/PageHeader.jsx'
import { Button } from '../ui/Button.jsx'

export function AdminFeedbackPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Feedback" title="Member feedback" description="Review messages and suggestions from your membership community." actions={[<Button key="review" variant="secondary">Review data</Button>]} />
      <Card className="space-y-4">
        <p className="text-slate-300">This section is preserved so the route remains compatible with the backend and future admin feedback features.</p>
      </Card>
    </div>
  )
}
