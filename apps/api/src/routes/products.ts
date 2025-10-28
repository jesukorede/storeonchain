// Replace in-memory store with Firestore persistence for GET/POST
import { Router } from 'express'
import { z } from 'zod'
import '../lib/firebaseAdmin'
import admin from 'firebase-admin'

const router = Router()

type Product = {
  id: string
  name: string
  price: number
  currency: 'HBAR' | 'USDC'
  category?: string
  location?: string
  description?: string
  imageUrl?: string
  imageUrls?: string[]
  sellerId?: string
}

const CreateProductSchema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  currency: z.enum(['HBAR', 'USDC']),
  category: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).max(3).optional(),
  sellerId: z.string().optional(),
})

router.get('/', async (req, res) => {
  const { category, token, q } = req.query as Record<string, string | undefined>
  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = admin.firestore().collection('products')
  if (category) query = query.where('category', '==', category)
  if (token) query = query.where('currency', '==', token)
  const snap = await query.limit(100).get()
  let items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
  if (q) items = items.filter(p => (p.name || '').toLowerCase().includes(q.toLowerCase()))
  res.json(items)
})

router.post('/', async (req, res) => {
  const parsed = CreateProductSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const id = 'p_' + Math.random().toString(36).slice(2, 8)
  const product: Product = { id, ...parsed.data }
  await admin.firestore().collection('products').doc(id).set({
    ...product,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })
  res.status(201).json(product)
})

export default router
