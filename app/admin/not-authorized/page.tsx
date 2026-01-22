export const dynamic = 'force-dynamic'

export default function NotAuthorizedPage() {
  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Not authorized</h1>
      <p className="mt-3 text-sm opacity-80">
        You don’t have access to the admin area.
      </p>
    </div>
  )
}
