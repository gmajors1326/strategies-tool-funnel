import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function AdminSupportTicketRedirect({ params }: { params: { ticketId: string } }) {
  redirect(`/admin/support/tickets/${params.ticketId}`)
}
