import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import { authRouter } from './auth/auth.routes.js'
import { errorHandler, notFoundHandler } from './common/error-handler.js'
import { env } from './config/env.js'
import { memberRouter } from './member/member.routes.js'
import { tfcRouter } from './routes/tfc.routes.js'

export const app = express()

function sanitizeRequest(request, _response, next) {
  if (request.body) {
    mongoSanitize.sanitize(request.body)
  }
  if (request.params) {
    mongoSanitize.sanitize(request.params)
  }
  next()
}

app.disable('x-powered-by')
app.use(helmet())
app.use(
  cors({
    origin: env.APP_CORS_ALLOWED_ORIGIN,
    credentials: true,
  }),
)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.NODE_ENV === 'production' ? 300 : 2000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (request) => request.path === '/api/health',
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(sanitizeRequest)

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/v1/members', memberRouter)
app.use('/api', tfcRouter)

app.use(notFoundHandler)
app.use(errorHandler)
