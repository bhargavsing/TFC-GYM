import mongoose from 'mongoose'
import { ZodError } from 'zod'
import { env } from '../config/env.js'
import { HttpError } from './http-error.js'

function isMongoDuplicateError(error) {
  return error instanceof Error && error.code === 11_000
}

export function notFoundHandler(request, _response, next) {
  next(new HttpError(404, `Route ${request.method} ${request.path} not found`))
}

export function errorHandler(error, _request, response, _next) {
  if (error instanceof ZodError) {
    response.status(400).json({
      type: 'https://gymflow.local/problems/validation',
      title: 'Validation failed',
      status: 400,
      detail: 'One or more fields are invalid',
      errors: error.flatten().fieldErrors,
    })
    return
  }

  if (isMongoDuplicateError(error)) {
    response.status(409).json({
      type: 'https://gymflow.local/problems/duplicate-resource',
      title: 'Duplicate resource',
      status: 409,
      detail: 'A resource with the same unique fields already exists',
    })
    return
  }

  if (error instanceof mongoose.Error.ValidationError) {
    response.status(400).json({
      type: 'https://gymflow.local/problems/validation',
      title: 'Validation failed',
      status: 400,
      detail: error.message,
    })
    return
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({
      type: 'about:blank',
      title: error.name,
      status: error.status,
      detail: error.message,
      ...(error.details === undefined ? {} : { errors: error.details }),
    })
    return
  }

  if (env.NODE_ENV !== 'test') {
    console.error(error)
  }

  response.status(500).json({
    type: 'about:blank',
    title: 'Internal server error',
    status: 500,
    detail: 'An unexpected error occurred',
  })
}
