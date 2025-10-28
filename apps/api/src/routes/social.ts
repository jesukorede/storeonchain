import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const FollowSchema = z.object({ userId: z.string(), sellerId: z.string() })
router.post('/follow', (req, res) => {
  const parsed = FollowSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  return res.status(201).json({ ok: true, action: 'follow', ...parsed.data })
})

const CommentSchema = z.object({ productId: z.string(), userId: z.string(), text: z.string().min(1) })
router.post('/comment', (req, res) => {
  const parsed = CommentSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  return res.status(201).json({ ok: true, action: 'comment', id: 'c_' + Math.random().toString(36).slice(2, 8), ...parsed.data })
})

const WishlistSchema = z.object({ userId: z.string(), productId: z.string() })
router.post('/wishlist', (req, res) => {
  const parsed = WishlistSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  return res.status(201).json({ ok: true, action: 'wishlist', ...parsed.data })
})

export default router
