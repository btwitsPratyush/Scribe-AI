import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

export const metadata: Metadata = {
  title: "ScribeAI - Turn Speech Into Superpowers",
  description: "Capture meeting audio in real-time. Transcribe smarter, faster, and beautifully.",
  generator: 'v0.app'
}

import SmoothScrolling from "@/components/smooth-scrolling";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} font-sans antialiased bg-off-white text-charcoal overflow-x-hidden`}>
        <SmoothScrolling />
        {children}
      </body>
    </html>
  )
}
