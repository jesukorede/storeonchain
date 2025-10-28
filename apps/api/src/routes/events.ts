// router.post('/') to submit HCS messages
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const EventSchema = z.object({
  type: z.string(),
  payload: z.record(z.any()),
  topicId: z.string().optional(),
})

router.post('/', async (req, res) => {
  const parsed = EventSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const topicId = parsed.data.topicId || process.env.HEDERA_TOPIC_ID
  if (!topicId) return res.status(400).json({ error: 'missing_topic_id' })
  const operatorId = process.env.HEDERA_OPERATOR_ID
  const operatorKey = process.env.HEDERA_OPERATOR_KEY
  if (!operatorId || !operatorKey) return res.status(500).json({ error: 'missing_operator' })

  try {
    const { Client, TopicMessageSubmitTransaction } = await import('@hashgraph/sdk')
    const net = (process.env.HEDERA_NETWORK || 'testnet').toLowerCase()
    const client = net === 'mainnet' ? Client.forMainnet() : net === 'previewnet' ? Client.forPreviewnet() : Client.forTestnet()
    client.setOperator(operatorId, operatorKey)

    const event = {
      id: 'evt_' + Math.random().toString(36).slice(2, 8),
      ts: new Date().toISOString(),
      type: parsed.data.type,
      payload: parsed.data.payload,
    }
    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify(event))
      .freezeWith(client)

    const submit = await tx.execute(client)
    const receipt = await submit.getReceipt(client)
    return res.status(201).json({ ...event, hcsStatus: receipt.status?.toString?.() || String(receipt.status) })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'hcs_submit_failed' })
  }
})

export default router
