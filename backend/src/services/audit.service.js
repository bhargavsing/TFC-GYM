import { AuditLog } from '../models/tfc.models.js'

export async function audit(request, action, entityType, entityId, values = {}) {
  await AuditLog.create({
    actorId: request.user?.id,
    action,
    entityType,
    entityId: entityId?.toString(),
    previousValues: values.previousValues,
    newValues: values.newValues,
    ipAddress: request.ip,
    userAgent: request.get('user-agent'),
  })
}
