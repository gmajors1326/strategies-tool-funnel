import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ToolPage({ params }: { params: { toolId: string } }) {
  redirect(`/tools/${params.toolId}`)
}
