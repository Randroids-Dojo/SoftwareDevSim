import type { Metadata } from 'next'
import './globals.css'
import UpdateBanner from '../components/UpdateBanner'

export const metadata: Metadata = {
  title: 'SoftwareDevSim',
  description: 'A collaboratively agentic coded game about software development',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UpdateBanner />
        {children}
      </body>
    </html>
  )
}
