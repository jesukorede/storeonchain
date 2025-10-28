import './globals.css'
import type { Metadata } from 'next'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import SocketProvider from '@/components/SocketProvider'
import AuthProvider from '@/components/AuthProvider'
import WCProvider from '@/components/WCProvider'
import ToastProvider from '@/components/ToastProvider'
import Button from "@/components/ui/Button"
import Image from 'next/image'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Store Onchain',
  description: 'Africa’s hybrid Web2–Web3 marketplace',
  icons: { icon: '/logo.png' },
  viewport: { width: 'device-width', initialScale: 1 },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-fg min-h-screen antialiased">
        <AuthProvider>
        <WCProvider>
        <div className="min-h-screen">
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <SocketProvider />
          <ToastProvider />
        </div>
        </WCProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
