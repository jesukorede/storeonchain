import ProductCard from "@/components/ProductCard"
import Button from "@/components/ui/Button"
type Product = { id: string; name: string; price: number; currency: 'HBAR' | 'USDC' }

async function getProducts(): Promise<Product[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
  try {
    const res = await fetch(`${base}/api/products`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch')
    return await res.json()
  } catch {
    return [
      { id: 'p1', name: 'Kente Jacket', price: 120, currency: 'HBAR' },
      { id: 'p2', name: 'Handmade Sculpture', price: 80, currency: 'USDC' },
      { id: 'p3', name: 'Solar Power Bank', price: 60, currency: 'HBAR' },
    ]
  }
}

export default async function HomePage() {
  const products = await getProducts()
  return (
    <div className="grid gap-6">
      <section className="rounded-xl p-8 bg-card shadow-card">
        <div className="bg-brand-radial rounded-xl p-8">
          <h1 className="text-3xl font-bold">Discover local products</h1>
          <p className="mt-2 text-fg-muted">Fashion, electronics, and art — with escrow and rewards on Hedera.</p>
          <div className="mt-6">
            <Button href="/products">Shop now</Button>
          </div>
        </div>
      </section>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </section>
    </div>
  )
}
