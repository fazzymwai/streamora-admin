import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AuthProvider } from '../auth/AuthProvider'
import AdminGate from '../components/AdminGate'
import './globals.css'

export const metadata: Metadata = {
  title: 'Streamora Admin',
  description: 'Admin portal for the Streamora catalog',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AdminGate>{children}</AdminGate>
        </AuthProvider>
      </body>
    </html>
  )
}
