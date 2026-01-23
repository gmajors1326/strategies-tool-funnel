import type { Metadata } from "next"
import { League_Spartan, Poppins } from "next/font/google"
import "./globals.css"

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
  return (
    <html lang="en">
      <body className={`${poppins.className} ${leagueSpartan.variable}`}>
        {children}
      </body>
    </html>
  )
}
