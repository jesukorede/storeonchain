"use client"

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket() {
  if (socket) return socket
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
  socket = io(base, { transports: ['websocket'], autoConnect: true })
  return socket
}
