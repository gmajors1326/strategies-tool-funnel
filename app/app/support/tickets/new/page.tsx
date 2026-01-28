import { requireUser } from '@/src/lib/auth/requireUser'
import SupportTicketForm from './support-ticket-form'

export const dynamic = 'force-dynamic'

export default async function NewSupportTicketPage() {
  await requireUser()

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-[#1f3b2b]">Create support ticket</h1>
        <p className="text-sm text-[#1f3b2b]">
          Describe the issue and we will follow up by email.
        </p>
      </div>
      <SupportTicketForm />
    </section>
  )
}
