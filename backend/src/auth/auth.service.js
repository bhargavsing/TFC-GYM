import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { HttpError } from '../common/http-error.js'
import { RefreshToken, User } from '../models/tfc.models.js'

function toUserResponse(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    accountStatus: user.accountStatus,
    profilePhotoUrl: user.profilePhotoUrl,
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function parseRefreshExpiry() {
  const days = Number.parseInt(env.REFRESH_TOKEN_EXPIRES_IN, 10) || 30
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + days)
  return expiresAt
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, accountStatus: user.accountStatus },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN },
  )
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString(), session: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  })
}

async function persistRefreshToken(user, refreshToken, request) {
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: parseRefreshExpiry(),
    userAgent: request.get('user-agent'),
    ipAddress: request.ip,
  })
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
    path: '/api/auth',
  }
}

export async function registerUser(input, role = 'CUSTOMER') {
  const passwordHash = await bcrypt.hash(input.password, 12)
  const user = await User.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash,
    role,
    accountStatus: role === 'CUSTOMER' ? 'ACTIVE' : 'PENDING',
  })

  return toUserResponse(user)
}

export async function loginUser({ identifier, password }, request, allowedRoles = []) {
  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
  })
    .select('+passwordHash loginAttempts lockedUntil')
    .exec()

  // Generic invalid credentials response to avoid user enumeration
  const invalidCredsError = new HttpError(401, 'Invalid credentials')

  if (!user) {
    // Delay response slightly to make enumeration harder
    await bcrypt.hash(password, 4).catch(() => {})
    throw invalidCredsError
  }

  // Check if account is temporarily locked due to repeated failures
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new HttpError(423, 'Account locked due to repeated failed login attempts. Try again later.')
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)

  if (!passwordMatches) {
    // Increment login attempts and lock account on threshold
    user.loginAttempts = (user.loginAttempts || 0) + 1
    const MAX_ATTEMPTS = 5
    const LOCK_MINUTES = 15
    if (user.loginAttempts >= MAX_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
      user.loginAttempts = 0
    }
    await user.save()
    throw invalidCredsError
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new HttpError(403, 'This login is not available for your role')
  }

  if (user.accountStatus !== 'ACTIVE') {
    throw new HttpError(403, `Account is ${user.accountStatus.toLowerCase()}`)
  }

  // Reset login attempts on successful login
  user.loginAttempts = 0
  user.lockedUntil = undefined
  user.lastLoginAt = new Date()
  await user.save()

  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)
  await persistRefreshToken(user, refreshToken, request)

  return { accessToken, refreshToken, user: toUserResponse(user) }
}

export async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new HttpError(401, 'Refresh token is required')
  }

  let decoded
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET)
  } catch {
    throw new HttpError(401, 'Refresh token is invalid')
  }

  const tokenHash = hashToken(refreshToken)
  const session = await RefreshToken.findOne({
    tokenHash,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).exec()

  if (!session) {
    throw new HttpError(401, 'Refresh session has expired')
  }

  const user = await User.findById(decoded.sub).exec()
  if (!user || user.accountStatus !== 'ACTIVE') {
    throw new HttpError(401, 'User session is not active')
  }

  return { accessToken: signAccessToken(user), user: toUserResponse(user) }
}

export async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return
  await RefreshToken.updateOne({ tokenHash: hashToken(refreshToken) }, { revokedAt: new Date() }).exec()
}

export async function revokeAllUserTokens(userId) {
  await RefreshToken.updateMany({ userId, revokedAt: { $exists: false } }, { revokedAt: new Date() }).exec()
}

export async function findAuthUser(userId) {
  const user = await User.findById(userId).lean().exec()
  if (!user) throw new HttpError(401, 'User not found')
  return toUserResponse(user)
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET)
  } catch {
    throw new HttpError(401, 'Access token is invalid')
  }
}
