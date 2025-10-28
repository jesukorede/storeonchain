"use client"

import { useEffect } from 'react'
import { getSocket } from '@/lib/socket'
import { useToast } from './ToastProvider'
import { upsertOrderStatus } from '@/lib/rxdb'

export default function SocketProvider() {
  const { toast } = useToast()
  useEffect(() => {
    const s = getSocket()
    const onConnect = () => {
      // Join common rooms. Pages can also join product:<id> as needed.
      s.emit('join', 'orders')
    }
    const onOrderCreated = (payload: any) => {
      toast({ title: 'Order created', message: JSON.stringify(payload), variant: 'info', duration: 9000 })
    }
    const onEscrowLocked = async (p: any) => { await upsertOrderStatus(p?.orderId, { status: 'locked', txHash: p?.hash, blockNumber: p?.blockNumber }); toast({ title: 'Escrow locked', message: `Order ${p?.orderId || ''} locked`, variant: 'success', duration: 9000 }) }
    const onEscrowReleased = async (p: any) => { await upsertOrderStatus(p?.orderId, { status: 'released', txHash: p?.hash, blockNumber: p?.blockNumber }); toast({ title: 'Escrow released', message: `Order ${p?.orderId || ''} released`, variant: 'success', duration: 9000 }) }
    const onEscrowRefunded = async (p: any) => { await upsertOrderStatus(p?.orderId, { status: 'refunded', txHash: p?.hash, blockNumber: p?.blockNumber }); toast({ title: 'Escrow refunded', message: `Order ${p?.orderId || ''} refunded`, variant: 'success', duration: 9000 }) }
    const onEscrowError = async (p: any) => { if (p?.orderId) await upsertOrderStatus(p.orderId, { status: 'error', txHash: p?.hash }); toast({ title: 'Escrow error', message: p?.message || 'Transaction failed', variant: 'error', duration: 9000 }) }
    s.on('connect', onConnect)
    s.on('order:created', onOrderCreated)
    s.on('escrow:locked', onEscrowLocked)
    s.on('escrow:released', onEscrowReleased)
    s.on('escrow:refunded', onEscrowRefunded)
    s.on('escrow:error', onEscrowError)
    return () => {
      s.off('connect', onConnect)
      s.off('order:created', onOrderCreated)
      s.off('escrow:locked', onEscrowLocked)
      s.off('escrow:released', onEscrowReleased)
      s.off('escrow:refunded', onEscrowRefunded)
      s.off('escrow:error', onEscrowError)
    }
  }, [])

  return null
}
