import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "The Strategy Tools",
  description: "Premium tools for strategic engagement and conversion",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
