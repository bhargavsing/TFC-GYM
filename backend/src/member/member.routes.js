import { Router } from 'express'
import {
  dashboard,
  listMembers,
  patchMember,
  postMember,
  removeMember,
} from './member.controller.js'

export const memberRouter = Router()

memberRouter.get('/dashboard', dashboard)
memberRouter.get('/', listMembers)
memberRouter.post('/', postMember)
memberRouter.patch('/:memberId', patchMember)
memberRouter.delete('/:memberId', removeMember)
