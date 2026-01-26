import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-[hsl(var(--border))] py-6 text-xs text-[hsl(var(--muted))]">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-3 px-4">
        <span>(c) {new Date().getFullYear()} The Strategy Tools</span>
        <Link className="underline underline-offset-4 hover:text-[hsl(var(--text))]" href="/privacy">
          Privacy Policy
        </Link>
        <Link className="underline underline-offset-4 hover:text-[hsl(var(--text))]" href="/terms">
          Terms of Service
        </Link>
      </div>
    </footer>
  )
}
