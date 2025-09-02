import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

export async function healthRoutes(fastify: FastifyInstance) {
  // GET /api/health
  fastify.get('/', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            version: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    }
  })

  // GET /api/health/ready
  fastify.get('/ready', {
    schema: {
      description: 'Readiness check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            checks: {
              type: 'object',
              properties: {
                database: { type: 'string' },
                redis: { type: 'string' },
                externalApis: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    // TODO: Implement actual health checks
    const checks = {
      database: 'healthy',
      redis: 'healthy',
      externalApis: 'healthy'
    }

    return {
      status: 'ready',
      checks
    }
  })

  // GET /api/health/live
  fastify.get('/live', {
    schema: {
      description: 'Liveness check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      status: 'alive',
      timestamp: new Date().toISOString()
    }
  })
}