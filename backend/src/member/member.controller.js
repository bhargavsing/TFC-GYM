import { createMemberSchema, updateMemberSchema } from './member.schema.js'
import {
  createMember,
  deleteMember,
  findAllMembers,
  getMemberDashboard,
  updateMember,
} from './member.service.js'

export async function listMembers(_request, response, next) {
  try {
    response.json(await findAllMembers())
  } catch (error) {
    next(error)
  }
}

export async function postMember(request, response, next) {
  try {
    const input = createMemberSchema.parse(request.body)
    response.status(201).json(await createMember(input))
  } catch (error) {
    next(error)
  }
}

export async function dashboard(request, response, next) {
  try {
    response.json(await getMemberDashboard())
  } catch (error) {
    next(error)
  }
}

export async function patchMember(request, response, next) {
  try {
    const input = updateMemberSchema.parse(request.body)
    response.json(await updateMember(request.params.memberId, input))
  } catch (error) {
    next(error)
  }
}

export async function removeMember(request, response, next) {
  try {
    await deleteMember(request.params.memberId)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
