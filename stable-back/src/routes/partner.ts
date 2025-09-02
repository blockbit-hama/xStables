import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { monetizationService } from '../services/monetization-service';

// ============ Request/Response Schemas ============
const WhiteLabelConfigRequestSchema = z.object({
  partnerId: z.string().min(1),
  brandName: z.string().min(1),
  primaryColor: z.string().optional(),
  logoUrl: z.string().url().optional(),
  customDomain: z.string().optional(),
  features: z.array(z.string()).optional(),
});

const PartnerAnalyticsRequestSchema = z.object({
  partnerId: z.string().min(1),
  period: z.string().optional().default('30d'),
});

// ============ Routes ============
export async function partnerRoutes(fastify: FastifyInstance) {
  
  /**
   * GET /api/partner/white-label/:partnerId
   * 파트너 화이트라벨 설정 조회
   */
  fastify.get('/white-label/:partnerId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          partnerId: { type: 'string' },
        },
        required: ['partnerId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                partnerId: { type: 'string' },
                brandName: { type: 'string' },
                primaryColor: { type: 'string' },
                logoUrl: { type: 'string' },
                customDomain: { type: 'string' },
                features: {
                  type: 'array',
                  items: { type: 'string' },
                },
                widgetConfig: {
                  type: 'object',
                  properties: {
                    theme: { type: 'string' },
                    language: { type: 'string' },
                    defaultTokens: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { partnerId } = request.params as { partnerId: string };

      // 실제로는 데이터베이스에서 조회
      // 여기서는 예시 데이터 반환
      const whiteLabelConfig = {
        partnerId,
        brandName: 'Partner Exchange',
        primaryColor: '#3B82F6',
        logoUrl: 'https://example.com/logo.png',
        customDomain: 'swap.partner.com',
        features: ['basic_swap', 'krw_optimization', 'analytics'],
        widgetConfig: {
          theme: 'light',
          language: 'ko',
          defaultTokens: ['USDC', 'USDT', 'KRWx'],
        },
      };

      return {
        success: true,
        data: whiteLabelConfig,
      };

    } catch (error) {
      fastify.log.error('White label config fetch error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch white label config',
      });
    }
  });

  /**
   * POST /api/partner/white-label/:partnerId
   * 파트너 화이트라벨 설정 업데이트
   */
  fastify.post('/white-label/:partnerId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          partnerId: { type: 'string' },
        },
        required: ['partnerId'],
      },
      body: WhiteLabelConfigRequestSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                partnerId: { type: 'string' },
                brandName: { type: 'string' },
                primaryColor: { type: 'string' },
                logoUrl: { type: 'string' },
                customDomain: { type: 'string' },
                features: {
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
      const { partnerId } = request.params as { partnerId: string };
      const config = request.body as z.infer<typeof WhiteLabelConfigRequestSchema>;

      // 실제로는 데이터베이스에 저장
      const updatedConfig = {
        partnerId,
        brandName: config.brandName,
        primaryColor: config.primaryColor || '#3B82F6',
        logoUrl: config.logoUrl || '',
        customDomain: config.customDomain || '',
        features: config.features || ['basic_swap'],
      };

      return {
        success: true,
        data: updatedConfig,
      };

    } catch (error) {
      fastify.log.error('White label config update error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update white label config',
      });
    }
  });

  /**
   * GET /api/partner/analytics/:partnerId
   * 파트너 분석 데이터 조회
   */
  fastify.get('/analytics/:partnerId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          partnerId: { type: 'string' },
        },
        required: ['partnerId'],
      },
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['1d', '7d', '30d', '90d'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                partnerId: { type: 'string' },
                period: { type: 'string' },
                totalVolumeUsd: { type: 'number' },
                totalRevenueUsd: { type: 'number' },
                transactionCount: { type: 'number' },
                averageTransactionSize: { type: 'number' },
                uniqueUsers: { type: 'number' },
                topTokens: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                      volumeUsd: { type: 'number' },
                      transactionCount: { type: 'number' },
                    },
                  },
                },
                dailyStats: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string' },
                      volumeUsd: { type: 'number' },
                      revenueUsd: { type: 'number' },
                      transactionCount: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { partnerId } = request.params as { partnerId: string };
      const { period = '30d' } = request.query as { period?: string };

      // 파트너 정보 조회
      const partner = await monetizationService.getPartner(partnerId);
      if (!partner) {
        return reply.status(404).send({
          success: false,
          error: 'Partner not found',
        });
      }

      // 실제로는 데이터베이스에서 상세 분석 데이터 조회
      // 여기서는 예시 데이터 반환
      const analytics = {
        partnerId,
        period,
        totalVolumeUsd: partner.totalVolumeUsd,
        totalRevenueUsd: partner.totalRevenueUsd,
        transactionCount: partner.transactionCount,
        averageTransactionSize: partner.totalVolumeUsd / Math.max(partner.transactionCount, 1),
        uniqueUsers: 150, // 실제로는 계산 필요
        topTokens: [
          { token: 'USDC', volumeUsd: 50000, transactionCount: 25 },
          { token: 'USDT', volumeUsd: 30000, transactionCount: 15 },
          { token: 'KRWx', volumeUsd: 20000, transactionCount: 10 },
        ],
        dailyStats: [
          { date: '2024-01-01', volumeUsd: 1000, revenueUsd: 0.5, transactionCount: 5 },
          { date: '2024-01-02', volumeUsd: 1500, revenueUsd: 0.75, transactionCount: 7 },
          // ... 더 많은 일별 데이터
        ],
      };

      return {
        success: true,
        data: analytics,
      };

    } catch (error) {
      fastify.log.error('Partner analytics fetch error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch partner analytics',
      });
    }
  });

  /**
   * GET /api/partner/sdk
   * SDK 문서 조회
   */
  fastify.get('/sdk', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                version: { type: 'string' },
                installation: { type: 'string' },
                quickStart: { type: 'string' },
                apiReference: { type: 'string' },
                examples: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      code: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const sdkDocs = {
        version: '1.0.0',
        installation: 'npm install @xstables/sdk',
        quickStart: 'https://docs.xstables.com/sdk/quick-start',
        apiReference: 'https://docs.xstables.com/sdk/api-reference',
        examples: [
          {
            title: 'Basic Swap Widget',
            description: 'Embed a basic swap widget in your application',
            code: `
import { SwapWidget } from '@xstables/sdk';

<SwapWidget
  partnerId="your-partner-id"
  theme="light"
  defaultTokens={['USDC', 'KRWx']}
  onSwap={(result) => console.log('Swap completed:', result)}
/>`,
          },
          {
            title: 'Custom Integration',
            description: 'Integrate with your own UI using the SDK',
            code: `
import { xStablesSDK } from '@xstables/sdk';

const sdk = new xStablesSDK({
  partnerId: 'your-partner-id',
  apiKey: 'your-api-key'
});

const quote = await sdk.getQuote({
  tokenIn: 'USDC',
  tokenOut: 'KRWx',
  amountIn: '1000'
});`,
          },
        ],
      };

      return {
        success: true,
        data: sdkDocs,
      };

    } catch (error) {
      fastify.log.error('SDK docs fetch error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch SDK documentation',
      });
    }
  });
}