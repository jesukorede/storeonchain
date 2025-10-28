import 'dotenv/config'
import express = require('express')
import cors = require('cors')
import productsRouter from './routes/products'
import ordersRouter from './routes/orders'
import promotionsRouter from './routes/promotions'
import eventsRouter from './routes/events'
import socialRouter from './routes/social'
import escrowRouter from './routes/escrow'
import * as http from 'http'
import { Server as IOServer } from 'socket.io'
import { setIO } from './socket'
import helmet = require('helmet')
import compression = require('compression')
import morgan = require('morgan')
const rateLimit = require('express-rate-limit')

const app = express()
// CORS whitelist
const allowedOrigin = process.env.CORS_ORIGIN || process.env.NEXT_PUBLIC_WEB_ORIGIN || '*'
app.use(cors({ origin: allowedOrigin, credentials: true }))

// Security & performance
app.use(helmet.default())
app.use(compression())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Rate limit for API
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 })
app.use('/api', limiter)

app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/promotions', promotionsRouter)
app.use('/api/events', eventsRouter)
app.use('/api/social', socialRouter)
app.use('/api/escrow', escrowRouter)

const port = process.env.PORT || 4000
const server = http.createServer(app)
const io = new IOServer(server, { cors: { origin: '*' } })
setIO(io)

io.on('connection', (socket) => {
  // Basic room joining: client can join rooms like user:<id>, product:<id>, order:<id>
  socket.on('join', (room: string) => socket.join(room))
  socket.on('leave', (room: string) => socket.leave(room))
})

server.listen(port, () => console.log(`API running on :${port}`))

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down...')
  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
  // Force exit if not closed in time
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
