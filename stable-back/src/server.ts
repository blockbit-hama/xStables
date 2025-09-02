import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { config } from './config'
import { quoteRoutes } from './routes/quote'
import { txRoutes } from './routes/tx'
import { healthRoutes } from './routes/health'
import { monetizationRoutes } from './routes/monetization'
import { riskRoutes } from './routes/risk'
import { partnerRoutes } from './routes/partner'

const fastify = Fastify({
  logger: {
    level: config.LOG_LEVEL,
    transport: config.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined
  }
})

async function buildServer() {
  // Security plugins
  await fastify.register(helmet, {
    contentSecurityPolicy: false
  })

  await fastify.register(cors, {
    origin: config.ALLOWED_ORIGINS,
    credentials: true
  })

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  })

  // Swagger documentation
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'xStables API',
        description: 'Stablecoin Router API - Efficient cross-chain stablecoin swapping',
        version: '1.0.0'
      },
      host: 'localhost:3001',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'quote', description: 'Quote related endpoints' },
        { name: 'transaction', description: 'Transaction related endpoints' },
        { name: 'health', description: 'Health check endpoints' },
        { name: 'monetization', description: 'Monetization and fee management' },
        { name: 'risk', description: 'Risk assessment and management' },
        { name: 'partner', description: 'Partner and white label management' }
      ]
    }
  })

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    }
  })

  // Routes
  await fastify.register(quoteRoutes, { prefix: '/api/quote' })
  await fastify.register(txRoutes, { prefix: '/api/tx' })
  await fastify.register(healthRoutes, { prefix: '/api/health' })
  await fastify.register(monetizationRoutes, { prefix: '/api/monetization' })
  await fastify.register(riskRoutes, { prefix: '/api/risk' })
  await fastify.register(partnerRoutes, { prefix: '/api/partner' })

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error)
    
    if (error.validation) {
      reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
        details: error.validation
      })
      return
    }

    reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Something went wrong'
    })
  })

  return fastify
}

async function start() {
  try {
    const server = await buildServer()
    
    await server.listen({
      port: config.PORT,
      host: config.HOST
    })

    server.log.info(`🚀 Server running on http://${config.HOST}:${config.PORT}`)
    server.log.info(`📚 API Documentation available at http://${config.HOST}:${config.PORT}/docs`)
  } catch (err) {
    console.error('Error starting server:', err)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...')
  process.exit(0)
})

if (require.main === module) {
  start()
}

export { buildServer }