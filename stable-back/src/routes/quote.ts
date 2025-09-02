import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { QuoteRequestSchema, QuoteResponseSchema } from '../types'
import { QuoteService } from '../services/quote'

export async function quoteRoutes(fastify: FastifyInstance) {
  const quoteService = new QuoteService()

  // POST /api/quote
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const quoteRequest = QuoteRequestSchema.parse(request.body)
      
      fastify.log.info('Quote request received', {
        chainId: quoteRequest.chainId,
        fromToken: quoteRequest.fromToken,
        toToken: quoteRequest.toToken,
        amount: quoteRequest.amount,
        slippageBps: quoteRequest.slippageBps
      })

      const quote = await quoteService.getBestQuote(quoteRequest)
      
      fastify.log.info('Quote generated successfully', {
        provider: quote.bestRoute.provider,
        outputAmount: quote.bestRoute.outputAmount,
        totalValue: quote.bestRoute.totalValue
      })

      return quote
    } catch (error) {
      fastify.log.error('Quote generation failed', error)
      
      if (error instanceof Error) {
        reply.status(400).send({
          error: 'Quote Generation Failed',
          message: error.message
        })
        return
      }
      
      reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to generate quote'
      })
    }
  })

  // GET /api/quote/providers
  fastify.get('/providers', {
    schema: {
      description: 'Get list of supported quote providers',
      tags: ['quote'],
      response: {
        200: {
          type: 'object',
          properties: {
            providers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  supportedChains: { type: 'array', items: { type: 'number' } }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const providers = [
      {
        name: '0x',
        description: '0x Protocol aggregator',
        supportedChains: [1, 42161, 10, 137, 8217]
      },
      {
        name: '1inch',
        description: '1inch DEX aggregator',
        supportedChains: [1, 42161, 10, 137]
      },
      {
        name: 'Uniswap V3',
        description: 'Uniswap V3 direct integration',
        supportedChains: [1, 42161, 10, 137]
      },
      {
        name: 'Uniswap V2',
        description: 'Uniswap V2 direct integration',
        supportedChains: [1, 42161, 10, 137]
      }
    ]

    return { providers }
  })
}