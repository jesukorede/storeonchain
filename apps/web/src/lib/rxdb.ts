"use client"

// Lightweight, dynamic RxDB integration with safe fallbacks when the package is not installed.
// To enable offline cache, install:
//   npm i -w apps/web rxdb pouchdb-adapter-idb
// This module will no-op if RxDB is unavailable.

let _db: any | null = null

type OrderDoc = {
  id: string // orderIdHex (bytes32)
  status: string
  txHash?: string
  blockNumber?: number
  updatedAt?: number
}

export async function getDB() {
  if (typeof window === 'undefined') return null
  if (_db) return _db
  try {
    const rx = (await import('rxdb')) as any
    const { addRxPlugin, createRxDatabase } = rx
    // idb adapter
    const idb = await import('pouchdb-adapter-idb')
    addRxPlugin(idb.default || idb)

    _db = await createRxDatabase({ name: 'storeonchain', storage: rx.getRxStoragePouch('idb') })

    if (!_db.collections.orders) {
      await _db.addCollections({
        orders: {
          schema: {
            title: 'orders schema',
            version: 0,
            primaryKey: 'id',
            type: 'object',
            properties: {
              id: { type: 'string', maxLength: 66 },
              status: { type: 'string' },
              txHash: { type: 'string' },
              blockNumber: { type: 'number' },
              updatedAt: { type: 'number' },
            },
            required: ['id', 'status'],
          },
        },
      })
    }
    return _db
  } catch (e) {
    // RxDB not available; return null so callers can skip.
    return null
  }
}

export async function upsertOrderStatus(id: string, data: Partial<OrderDoc>) {
  const db = await getDB()
  if (!db) return
  const now = Date.now()
  const col = db.collections.orders
  const existing = await col.findOne(id).exec()
  if (existing) {
    await existing.patch({ ...data, updatedAt: now })
  } else {
    await col.insert({ id, status: data.status || 'unknown', txHash: data.txHash, blockNumber: data.blockNumber, updatedAt: now })
  }
}
