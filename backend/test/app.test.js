import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../src/app.js'

describe('GymFlow API', () => {
  it('reports its health', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })

  it('validates member input before accessing MongoDB', async () => {
    const response = await request(app).post('/api/v1/members').send({
      firstName: '',
      lastName: 'Rao',
      email: 'not-an-email',
      phone: '123',
    })

    expect(response.status).toBe(400)
    expect(response.body.title).toBe('Validation failed')
    expect(response.body.errors).toHaveProperty('firstName')
    expect(response.body.errors).toHaveProperty('email')
    expect(response.body.errors).toHaveProperty('phone')
  })

  it('returns a structured response for unknown routes', async () => {
    const response = await request(app).get('/api/not-here')

    expect(response.status).toBe(404)
    expect(response.body.detail).toContain('Route GET /api/not-here not found')
  })
})
