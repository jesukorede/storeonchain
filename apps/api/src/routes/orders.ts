// Persist order creation to Firestore and keep socket broadcasts
import { Router } from 'express'
import { z } from 'zod'
import { getIO } from '../socket'
import '../lib/firebaseAdmin'
import admin = require('firebase-admin')

const router = Router()

const OrderSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  paymentToken: z.enum(['HBAR', 'USDC']),
  buyerWallet: z.string().optional(),
})

router.post('/', async (req, res) => {
  const parsed = OrderSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }
  const order = {
    id: 'ord_' + Math.random().toString(36).slice(2, 8),
    status: 'created',
    ...parsed.data,
  }
  await admin.firestore().collection('orders').doc(order.id).set({
    ...order,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })

  const io = getIO()
  if (io) {
    io.to(`product:${order.productId}`).emit('order:created', order)
    io.to('orders').emit('order:created', order)
  }
  return res.status(201).json(order)
})

export default router
