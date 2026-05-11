import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env'
import { authRouter } from './auth/routes'
import { policiesRouter } from './routes/policies'
import { claimsRouter } from './routes/claims'
import { invoicesRouter } from './routes/invoices'
import { referralsRouter } from './routes/referrals'
import { usersRouter } from './routes/users'
import { lookupsRouter } from './routes/lookups'
import { errorHandler } from './middleware/error'

const app = express()

// Parse CORS_ORIGIN — may be comma-separated list
function parseCorsOrigins(raw: string): string | string[] {
  const origins = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return origins.length === 1 ? origins[0] : origins
}

app.use(helmet())
app.use(
  cors({
    origin: parseCorsOrigins(env.CORS_ORIGIN),
    credentials: true,
  })
)
app.use(express.json())
app.use(morgan(env.NODE_ENV === 'production' ? 'tiny' : 'dev'))

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }))

app.use('/auth', authRouter)
app.use('/api/policies', policiesRouter)
app.use('/api/claims', claimsRouter)
app.use('/api/invoices', invoicesRouter)
app.use('/api/referrals', referralsRouter)
app.use('/api/users', usersRouter)
app.use('/api/lookups', lookupsRouter)

app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`API listening on :${env.PORT}`)
})
