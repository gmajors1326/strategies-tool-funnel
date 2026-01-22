import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ToolPage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params
  redirect(`/tools/${toolId}`)
}
