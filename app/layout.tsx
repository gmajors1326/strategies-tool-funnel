import type { Metadata } from "next"
import { League_Spartan, Poppins } from "next/font/google"
import { headers } from "next/headers"
import "./globals.css"
import { SiteHeader } from "@/src/components/marketing/SiteHeader"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
})

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
})

export const metadata: Metadata = {
  title: "The Strategy Tools",
  description: "Premium tools for strategic engagement and conversion",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const h = headers()
  const pathname = h.get("x-pathname") || h.get("next-url") || ""

  return (
    <html lang="en">
      <body className={`${poppins.className} ${leagueSpartan.variable}`}>
        <SiteHeader pathname={pathname} />
        {children}
      </body>
    </html>
  )
}
