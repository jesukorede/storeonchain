// router.post('/prepare/lock'...) and LockSchema
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { buildUnsignedTx, encodeFunction, getEscrowAddress, getProvider } from '../services/evm'
import requireAuth, { type AuthedRequest } from '../middleware/auth'
import { getIO } from '../socket'
import '../lib/firebaseAdmin'
import admin from 'firebase-admin'

const router = Router()
router.use(requireAuth)

// Prepare unsigned tx: lock(orderId, seller, deadline, amount)
const LockSchema = z.object({
  orderId: z.string().min(1),
  seller: z.string().startsWith('0x').length(42),
  deadline: z.number().int().positive(),
  amountWei: z.string().regex(/^\d+$/),
})
router.post('/prepare/lock', async (req: AuthedRequest, res: Response) => {
  const parsed = LockSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { orderId, seller, deadline, amountWei } = parsed.data
  const orderIdBytes32 = '0x' + Buffer.from(orderId).toString('hex').padEnd(64, '0').slice(0, 64)
  const data = await encodeFunction('lock(bytes32,address,uint256)', [orderIdBytes32, seller, BigInt(deadline)])
  const to = getEscrowAddress()
  const tx = await buildUnsignedTx(to, data, amountWei)
  return res.json({ tx })
})

// Prepare unsigned tx: release(orderId)
const ReleaseSchema = z.object({ orderId: z.string().min(1) })
router.post('/prepare/release', async (req: AuthedRequest, res: Response) => {
  const parsed = ReleaseSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const orderIdBytes32 = '0x' + Buffer.from(parsed.data.orderId).toString('hex').padEnd(64, '0').slice(0, 64)
  const data = await encodeFunction('release(bytes32)', [orderIdBytes32])
  const to = getEscrowAddress()
  const tx = await buildUnsignedTx(to, data)
  return res.json({ tx })
})

// Prepare unsigned tx: refund(orderId)
router.post('/prepare/refund', async (req: AuthedRequest, res: Response) => {
  const parsed = ReleaseSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const orderIdBytes32 = '0x' + Buffer.from(parsed.data.orderId).toString('hex').padEnd(64, '0').slice(0, 64)
  const data = await encodeFunction('refund(bytes32)', [orderIdBytes32])
  const to = getEscrowAddress()
  const tx = await buildUnsignedTx(to, data)
  return res.json({ tx })
})

// Verify receipt (stub for now; extend to mirror checks/emitting socket events)
const VerifySchema = z.object({ hash: z.string().startsWith('0x').length(66) })
router.post('/verify', async (req: AuthedRequest, res: Response) => {
  const parsed = VerifySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  try {
    const { hash } = parsed.data
    const provider = await getProvider()
    const receipt = await provider.getTransactionReceipt(hash)
    const io = getIO()
    if (!receipt) {
      io?.emit('escrow:pending', { hash })
      return res.json({ ok: true, pending: true })
    }

    const addr = getEscrowAddress().toLowerCase()
    const { Interface } = await (await import('ethers')).ethers ?? await import('ethers')
    const iface = new Interface([
      'event Locked(bytes32 indexed orderId)',
      'event Released(bytes32 indexed orderId)',
      'event Refunded(bytes32 indexed orderId)',
    ])

    let matched: { event: string; orderId?: string } | null = null
    for (const log of receipt.logs) {
      if ((log.address || '').toLowerCase() !== addr) continue
      try {
        const parsedLog = iface.parseLog({ topics: log.topics as string[], data: log.data as string })
        const name = parsedLog?.name
        const orderIdHex: string | undefined = parsedLog?.args?.orderId
        if (name && orderIdHex) {
          matched = { event: name.toLowerCase(), orderId: orderIdHex }
          break
        }
      } catch {}
    }

    if (matched) {
      const room = `order:${matched.orderId}`
      const payload = { orderId: matched.orderId, hash, blockNumber: receipt.blockNumber }
      if (matched.event === 'locked') { io?.emit('escrow:locked', payload); io?.to(room).emit('escrow:locked', payload) }
      else if (matched.event === 'released') { io?.emit('escrow:released', payload); io?.to(room).emit('escrow:released', payload) }
      else if (matched.event === 'refunded') { io?.emit('escrow:refunded', payload); io?.to(room).emit('escrow:refunded', payload) }
      else { io?.emit('escrow:error', { hash, message: 'Unknown escrow event' }); io?.to(room).emit('escrow:error', { hash, message: 'Unknown escrow event' }) }

      // Persist to Firestore
      const status = matched.event
      const docRef = admin.firestore().collection('orders').doc(matched.orderId!)
      await docRef.set({
        status,
        txHash: hash,
        blockNumber: receipt.blockNumber,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
      return res.json({ ok: true, event: matched.event, orderId: matched.orderId })
    }

    io?.emit('escrow:error', { hash, message: 'No escrow logs matched' })
    return res.json({ ok: false, error: 'no_match' })
  } catch (e: any) {
    const io = getIO()
    io?.emit('escrow:error', { message: e?.message || 'Verify failed' })
    return res.status(500).json({ error: 'verify_failed' })
  }
})

export default router
