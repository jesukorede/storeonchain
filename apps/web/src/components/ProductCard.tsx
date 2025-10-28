"use client"

import { useState } from 'react'

type Product = { id: string; name: string; price: number; currency: 'HBAR' | 'USDC' }

type Props = { product: Product }

export default function ProductCard({ product }: Props) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [showPromo, setShowPromo] = useState(false)
  const [durationDays, setDurationDays] = useState(7)
  const [promoToken, setPromoToken] = useState<'HBAR' | 'RUHM'>('HBAR')

  async function addToCart() {
    setLoading(true)
    setMsg(null)
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
    try {
      const res = await fetch(`${base}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          paymentToken: product.currency === 'USDC' ? 'USDC' : 'HBAR',
        }),
      })
      if (!res.ok) throw new Error('Failed to create order')
      const data = await res.json()
      setMsg(`Order ${data.id} created`) 
    } catch (e: any) {
      setMsg(e.message || 'Error creating order')
    } finally {
      setLoading(false)
    }
  }

  async function createPromotion() {
    setLoading(true)
    setMsg(null)
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
    try {
      const res = await fetch(`${base}/api/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, durationDays, paymentToken: promoToken }),
      })
      if (!res.ok) throw new Error('Failed to create promotion')
      const data = await res.json()
      setMsg(`Promotion ${data.id} initiated`)
      setShowPromo(false)
    } catch (e: any) {
      setMsg(e.message || 'Error creating promotion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl bg-card p-4 shadow-card">
      <div className="aspect-[4/3] rounded-lg bg-border/30 mb-3" />
      <div className="font-medium">{product.name}</div>
      <div className="text-sm text-fg-muted">{product.currency} · {product.price}</div>
      <button
        onClick={addToCart}
        disabled={loading}
        className="mt-3 w-full btn-primary-gradient rounded-md py-2 disabled:opacity-60"
      >
        {loading ? 'Processing...' : 'Create order'}
      </button>
      <button
        onClick={() => setShowPromo(true)}
        className="mt-2 w-full rounded-md py-2 border border-border text-sm hover:bg-border/20"
      >
        Promote
      </button>
      {msg && <div className="mt-2 text-xs text-fg-muted">{msg}</div>}

      {showPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-card p-4 shadow-card">
            <div className="text-lg font-semibold mb-2">Promote listing</div>
            <label className="block text-sm mb-1">Duration (days)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value || '1'))}
              className="w-full mb-3 rounded-md bg-bg border border-border px-3 py-2"
            />
            <label className="block text-sm mb-1">Payment token</label>
            <select
              value={promoToken}
              onChange={(e) => setPromoToken(e.target.value as 'HBAR' | 'RUHM')}
              className="w-full mb-4 rounded-md bg-bg border border-border px-3 py-2"
            >
              <option value="HBAR">HBAR</option>
              <option value="RUHM">RUHM</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowPromo(false)} className="px-3 py-2 text-sm border border-border rounded-md">Cancel</button>
              <button onClick={createPromotion} disabled={loading} className="px-3 py-2 text-sm rounded-md btn-primary-gradient disabled:opacity-60">{loading ? 'Processing...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
