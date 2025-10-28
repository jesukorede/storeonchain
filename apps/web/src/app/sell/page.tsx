"use client"

import { useState } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Card, { CardContent } from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { useAuth } from "@/components/AuthProvider"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

type Form = {
  name: string
  price: number
  currency: "HBAR" | "USDC"
  category?: string
  location?: string
  description?: string
  imageUrl?: string
}

export default function SellPage() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"
  const [form, setForm] = useState<Form>({ name: "", price: 0, currency: "HBAR", category: "fashion" })
  const { user } = useAuth()
  const [priceRaw, setPriceRaw] = useState<string>("")
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 3)
    if (!files.length) return
    try {
      setUploading(true)
      const folder = `products/${user?.uid || "public"}`
      const urls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const r = ref(storage, `${folder}/${Date.now()}_${i}_${f.name}`)
        await uploadBytes(r, f)
        const url = await getDownloadURL(r)
        urls.push(url)
      }
      setImageUrls(urls)
    } finally {
      setUploading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const priceNum = Number(priceRaw)
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        setMsg("Enter a valid price greater than 0")
        setLoading(false)
        return
      }
      const payload = { ...form, price: priceNum, imageUrls }
      const res = await fetch(`${base}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to create product")
      const data = await res.json()
      setMsg(`Listing created: ${data.id}`)
      setForm({ name: "", price: 0, currency: "HBAR", category: "fashion" })
      setPriceRaw("")
      setImageUrls([])
    } catch (e: any) {
      setMsg(e.message || "Error creating listing")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <PageHeader
          title="Create a product listing"
          subtitle="Publish items to the marketplace and accept HBAR or USDC."
          align="left"
        />
        <Card>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4">
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Price"
                  type="number"
                  min={0}
                  value={priceRaw}
                  onChange={(e) => setPriceRaw(e.target.value)}
                  placeholder="e.g. 100"
                  required
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Token</label>
                  <select value={form.currency} onChange={(e) => set("currency", e.target.value as any)} className="w-full px-4 py-2 rounded-md bg-slate-900/50 border border-slate-600 text-white">
                    <option value="HBAR">HBAR</option>
                    <option value="USDC">USDC</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Category</label>
                  <select value={form.category} onChange={(e) => set("category", e.target.value as any)} className="w-full px-4 py-2 rounded-md bg-slate-900/50 border border-slate-600 text-white">
                    <option value="fashion">Fashion</option>
                    <option value="electronics">Electronics</option>
                    <option value="art">Art</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Location"
                  value={form.location || ""}
                  onChange={(e) => set("location", e.target.value)}
                />
                <Input
                  label="Images (up to 3)"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onImagesChange}
                  hint="We upload images to Firebase Storage."
                />
              </div>

              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imageUrls.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt="preview" className="rounded-lg border border-slate-700/50 object-cover aspect-[4/3]" />
                  ))}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-300">Description</label>
                <textarea
                  value={form.description || ""}
                  onChange={(e) => set("description", e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition min-h-[120px]"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" loading={loading || uploading}>Publish listing</Button>
                {msg && <span className="text-xs text-slate-400">{msg}</span>}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
