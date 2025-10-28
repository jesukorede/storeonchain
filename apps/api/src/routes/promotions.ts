import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const PromoteSchema = z.object({
  productId: z.string(),
  durationDays: z.number().int().min(1).max(30),
  paymentToken: z.enum(['HBAR', 'RUHM'])
})

router.post('/', (req, res) => {
  const parsed = PromoteSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const promo = {
    id: 'pr_' + Math.random().toString(36).slice(2, 8),
    status: 'initiated',
    ...parsed.data,
  }
  return res.status(201).json(promo)
})

export default router
