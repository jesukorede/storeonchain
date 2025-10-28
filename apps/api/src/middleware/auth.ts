import { Request, Response, NextFunction } from 'express'
import { adminAuth } from '../lib/firebaseAdmin'

export interface AuthedRequest extends Request {
  user?: { uid: string; email?: string | null }
}

export default async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const authz = req.header('authorization') || req.header('Authorization')
    if (!authz || !authz.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ error: 'missing bearer token' })
    }
    const token = authz.slice(7)
    const decoded = await adminAuth.verifyIdToken(token)
    req.user = { uid: decoded.uid, email: decoded.email || null }
    return next()
  } catch (e: any) {
    return res.status(401).json({ error: 'invalid token' })
  }
}
