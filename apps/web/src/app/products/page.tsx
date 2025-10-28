"use client"

import { useEffect, useMemo, useState } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Card, { CardContent } from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"

type Product = {
  id: string
  name: string
  price: number
  currency: "HBAR" | "USDC"
  category?: string
  location?: string
  imageUrl?: string
}

export default function ProductsPage() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [category, setCategory] = useState<string>("")
  const [token, setToken] = useState<string>("")

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    if (category) p.set("category", category)
    if (token) p.set("token", token)
    return p.toString()
  }, [q, category, token])

  async function fetchItems(signal?: AbortSignal) {
    try {
      setLoading(true)
      const res = await fetch(`${base}/api/products${qs ? `?${qs}` : ""}`, { cache: "no-store", signal })
      const data = await res.json()
      setItems(data)
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Failed to load products:", err)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchItems(controller.signal)
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs])

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Products"
        subtitle="Browse marketplace listings and filter by category or token."
        align="left"
      />
      <Card>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <Input
              placeholder="Search products"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md bg-bg border border-border px-3 py-2">
              <option value="">All categories</option>
              <option value="fashion">Fashion</option>
              <option value="electronics">Electronics</option>
              <option value="art">Art</option>
            </select>
            <select value={token} onChange={(e) => setToken(e.target.value)} className="rounded-md bg-bg border border-border px-3 py-2">
              <option value="">Any token</option>
              <option value="HBAR">HBAR</option>
              <option value="USDC">USDC</option>
            </select>
            <Button onClick={() => fetchItems()} variant="secondary">Filter</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card p-4 shadow-card">
            <div className="aspect-[4/3] rounded-lg bg-border/30 animate-pulse mb-3" />
            <div className="h-4 w-1/2 bg-border/40 rounded mb-2" />
            <div className="h-3 w-1/3 bg-border/30 rounded" />
          </div>
        ))}
        {!loading && items.map((p) => (
          <div key={p.id} className="rounded-xl bg-card p-4 shadow-card">
            {(p as any).imageUrl || (p as any).imageUrls?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(p as any).imageUrl || (p as any).imageUrls?.[0]}
                alt={p.name}
                className="aspect-[4/3] w-full rounded-lg object-cover mb-3"
              />
            ) : (
              <div className="aspect-[4/3] rounded-lg bg-border/30 mb-3" />
            )}
            <div className="font-medium">{p.name}</div>
            <div className="text-sm text-fg-muted">{p.currency} · {p.price}</div>
          </div>
        ))}
        {!loading && !items.length && (
          <div className="text-fg-muted">No products match your filters.</div>
        )}
      </div>
    </div>
  )
}
