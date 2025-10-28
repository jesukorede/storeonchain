import type { Server as IOServer } from 'socket.io'

let io: IOServer | null = null

export function setIO(instance: IOServer) {
  io = instance
}

export function getIO(): IOServer | null {
  return io
}
