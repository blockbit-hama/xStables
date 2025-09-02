import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { krwStableService } from '../services/krw-stable-service';

// ============ Request/Response Schemas ============
const RiskAssessmentRequestSchema = z.object({
  tokenIn: z.string().min(1),
  tokenOut: z.string().min(1),
  amountIn: z.string().min(1),
  userAddress: z.string().min(1),
});

const DepegCheckRequestSchema = z.object({
  tokens: z.array(z.string()).min(1),
});

// ============ Routes ============
export async function riskRoutes(fastify: FastifyInstance) {
  
  /**
   * POST /api/risk/assess
   * 거래 리스크 평가
   */
  fastify.post('/assess', {
    schema: {
      body: RiskAssessmentRequestSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                riskScore: { type: 'number' },
                riskLevel: { type: 'string' },
                warnings: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      message: { type: 'string' },
                      severity: { type: 'string' },
                    },
                  },
                },
                recommendations: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { tokenIn, tokenOut, amountIn, userAddress } = request.body as z.infer<typeof RiskAssessmentRequestSchema>;

      // 디페그 체크
      const depegAlerts = await krwStableService.checkDepegStatus([tokenIn, tokenOut]);
      
      // 리스크 점수 계산 (0-100)
      let riskScore = 0;
      const warnings: any[] = [];
      const recommendations: string[] = [];

      // 디페그 리스크
      if (depegAlerts.length > 0) {
        riskScore += 50;
        depegAlerts.forEach(alert => {
          warnings.push({
            type: 'depeg',
            message: `Token ${alert.token} is depegged by ${alert.deviationBps} bps`,
            severity: alert.severity === 3 ? 'high' : alert.severity === 2 ? 'medium' : 'low',
          });
        });
      }

      // 거래량 리스크
      const amountInNumber = parseFloat(amountIn);
      if (amountInNumber > 100000) { // $100K 이상
        riskScore += 20;
        warnings.push({
          type: 'large_transaction',
          message: 'Large transaction detected',
          severity: 'medium',
        });
        recommendations.push('Consider splitting into smaller transactions');
      }

      // 리스크 레벨 결정
      let riskLevel: string;
      if (riskScore >= 70) {
        riskLevel = 'high';
      } else if (riskScore >= 40) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      // 권장사항 추가
      if (riskLevel === 'high') {
        recommendations.push('Consider waiting for better market conditions');
        recommendations.push('Use smaller transaction amounts');
      }

      return {
        success: true,
        data: {
          riskScore,
          riskLevel,
          warnings,
          recommendations,
        },
      };

    } catch (error) {
      fastify.log.error('Risk assessment error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to assess risk',
      });
    }
  });

  /**
   * POST /api/risk/check-depeg
   * 디페그 상태 체크
   */
  fastify.post('/check-depeg', {
    schema: {
      body: DepegCheckRequestSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                  currentPrice: { type: 'number' },
                  targetPrice: { type: 'number' },
                  deviationBps: { type: 'number' },
                  severity: { type: 'number' },
                  isDepegged: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { tokens } = request.body as z.infer<typeof DepegCheckRequestSchema>;

      const depegAlerts = await krwStableService.checkDepegStatus(tokens);

      return {
        success: true,
        data: depegAlerts,
      };

    } catch (error) {
      fastify.log.error('Depeg check error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to check depeg status',
      });
    }
  });

  /**
   * GET /api/risk/whitelist
   * 화이트리스트 토큰 조회
   */
  fastify.get('/whitelist', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  address: { type: 'string' },
                  symbol: { type: 'string' },
                  name: { type: 'string' },
                  decimals: { type: 'number' },
                  chainId: { type: 'number' },
                  pegCurrency: { type: 'string' },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  isActive: { type: 'boolean' },
                  depegThresholdBps: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const krwStables = await krwStableService.getAllKRWStables();

      return {
        success: true,
        data: krwStables,
      };

    } catch (error) {
      fastify.log.error('Whitelist fetch error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch whitelist',
      });
    }
  });
}