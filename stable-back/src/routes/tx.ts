import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { TxBuildRequestSchema, TxBuildResponseSchema } from '../types'
import { TransactionService } from '../services/transaction'

export async function txRoutes(fastify: FastifyInstance) {
  const txService = new TransactionService()

  // POST /api/tx/build
  fastify.post('/build', {
    schema: {
      description: 'Build transaction data for token swap',
      tags: ['transaction'],
      body: TxBuildRequestSchema,
      response: {
        200: TxBuildResponseSchema,
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const txRequest = TxBuildRequestSchema.parse(request.body)
      
      fastify.log.info('Transaction build request received', {
        chainId: txRequest.chainId,
        fromToken: txRequest.fromToken,
        toToken: txRequest.toToken,
        amount: txRequest.amount,
        userAddress: txRequest.userAddress
      })

      const txData = await txService.buildTransaction(txRequest)
      
      fastify.log.info('Transaction built successfully', {
        hasApproveTx: !!txData.approveTx,
        swapTxTo: txData.swapTx.to
      })

      return txData
    } catch (error) {
      fastify.log.error('Transaction build failed', error)
      
      if (error instanceof Error) {
        reply.status(400).send({
          error: 'Transaction Build Failed',
          message: error.message
        })
        return
      }
      
      reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to build transaction'
      })
    }
  })

  // POST /api/tx/simulate
  fastify.post('/simulate', {
    schema: {
      description: 'Simulate transaction execution',
      tags: ['transaction'],
      body: {
        type: 'object',
        properties: {
          chainId: { type: 'number' },
          to: { type: 'string' },
          data: { type: 'string' },
          value: { type: 'string' },
          from: { type: 'string' }
        },
        required: ['chainId', 'to', 'data', 'from']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            gasUsed: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { chainId, to, data, value, from } = request.body as any
      
      const simulation = await txService.simulateTransaction({
        chainId,
        to,
        data,
        value,
        from
      })

      return simulation
    } catch (error) {
      fastify.log.error('Transaction simulation failed', error)
      
      reply.status(500).send({
        error: 'Simulation Failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
}