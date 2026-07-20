import { Router } from 'express'
import { z } from 'zod'
import {
  loginUser,
  refreshCookieOptions,
  refreshSession,
  registerUser,
  revokeAllUserTokens,
  revokeRefreshToken,
} from './auth.service.js'
import { authenticate } from './auth.middleware.js'

export const authRouter = Router()

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().toLowerCase(),
  phone: z.string().trim().optional(),
  password: z.string().min(8).max(128),
})

const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(8).max(128),
})

function setRefreshCookie(response, token) {
  response.cookie('tfc_refresh_token', token, refreshCookieOptions())
}

authRouter.post('/register', async (request, response, next) => {
  try {
    response.status(201).json(await registerUser(registerSchema.parse(request.body)))
  } catch (error) {
    next(error)
  }
})

authRouter.post('/login', async (request, response, next) => {
  try {
    const session = await loginUser(loginSchema.parse(request.body), request, ['CUSTOMER'])
    setRefreshCookie(response, session.refreshToken)
    response.json({ accessToken: session.accessToken, user: session.user })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/admin/login', async (request, response, next) => {
  try {
    const session = await loginUser(loginSchema.parse(request.body), request, [
      'SUPER_ADMIN',
      'ADMIN',
      'PARTNER',
    ])
    setRefreshCookie(response, session.refreshToken)
    response.json({ accessToken: session.accessToken, user: session.user })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/refresh', async (request, response, next) => {
  try {
    response.json(await refreshSession(request.cookies.tfc_refresh_token))
  } catch (error) {
    next(error)
  }
})

authRouter.post('/logout', async (request, response, next) => {
  try {
    await revokeRefreshToken(request.cookies.tfc_refresh_token)
    response.clearCookie('tfc_refresh_token', refreshCookieOptions())
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

authRouter.post('/logout-all', authenticate, async (request, response, next) => {
  try {
    await revokeAllUserTokens(request.user.id)
    response.clearCookie('tfc_refresh_token', refreshCookieOptions())
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

authRouter.post('/forgot-password', (_request, response) => {
  response.json({ message: 'If the account exists, a reset link will be sent.' })
})

authRouter.post('/reset-password', (_request, response) => {
  response.json({ message: 'Password reset endpoint is ready for token validation wiring.' })
})

authRouter.get('/me', authenticate, (request, response) => {
  response.json(request.user)
})
