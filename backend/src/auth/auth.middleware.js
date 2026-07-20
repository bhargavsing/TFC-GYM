import { HttpError } from '../common/http-error.js'
import { findAuthUser, verifyAccessToken } from './auth.service.js'
import { Admin } from '../models/tfc.models.js'

export async function authenticate(request, _response, next) {
  try {
    const header = request.get('authorization') ?? ''
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : request.cookies?.tfc_admin_token

    if (!token) {
      throw new HttpError(401, 'Authentication is required')
    }

    const decoded = verifyAccessToken(token)

    if (decoded.type === 'admin') {
      const admin = await Admin.findById(decoded.sub).lean().exec()

      if (!admin || !admin.isActive) {
        throw new HttpError(403, 'Admin account is not active')
      }

      request.user = {
        id: admin._id.toString(),
        name: admin.name,
        username: admin.username,
        role: 'admin',
      }
      next()
      return
    }

    const user = await findAuthUser(decoded.sub)

    if (user.accountStatus !== 'ACTIVE') {
      throw new HttpError(403, `Account is ${user.accountStatus.toLowerCase()}`)
    }

    request.user = user
    next()
  } catch (error) {
    next(error)
  }
}

export function authorize(...roles) {
  return (request, _response, next) => {
    if (!request.user) {
      next(new HttpError(401, 'Authentication is required'))
      return
    }

    if (!roles.includes(request.user.role)) {
      next(new HttpError(403, 'You do not have permission to perform this action'))
      return
    }

    next()
  }
}

export const adminOnly = [authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'admin')]
export const superAdminOnly = [authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'admin')]
export const partnerOnly = [authenticate, authorize('PARTNER', 'SUPER_ADMIN')]
export const customerOnly = [authenticate, authorize('CUSTOMER', 'SUPER_ADMIN')]
