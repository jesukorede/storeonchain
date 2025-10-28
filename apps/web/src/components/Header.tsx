"use client"

import Image from "next/image"
import { useState } from "react"
import Button from "@/components/ui/Button"
import ConnectWalletButton from "@/components/ConnectWalletButton"
import { Menu, X } from "lucide-react"

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-bg/70 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <a href="/" className="font-semibold flex items-center gap-2">
          <Image src="/logo.png" alt="Store Onchain" width={24} height={24} priority className="rounded-sm" />
          <span className="text-base sm:text-lg">Store Onchain</span>
        </a>

        <nav className="hidden sm:flex items-center gap-3 text-sm text-fg-muted">
          <a href="/products" className="hover:text-fg">Products</a>
          <Button href="/sell" size="sm" variant="secondary">Sell</Button>
          <a href="/profile" className="hover:text-fg">Profile</a>
          <ConnectWalletButton />
        </nav>

        <button
          className="sm:hidden inline-flex items-center justify-center rounded-md p-2 border border-border/50"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="sm:hidden border-t border-border/50 bg-bg/95">
          <nav className="mx-auto max-w-6xl px-4 py-3 grid gap-2 text-sm">
            <a href="/products" className="px-3 py-2 rounded-md hover:bg-border/20">Products</a>
            <a href="/sell" className="px-3 py-2 rounded-md hover:bg-border/20">Sell</a>
            <a href="/profile" className="px-3 py-2 rounded-md hover:bg-border/20">Profile</a>
            <div className="mt-2">
              <ConnectWalletButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}