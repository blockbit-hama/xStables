import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { monetizationService } from '../services/monetization-service';
import { ttvEngine } from '../services/ttv-engine';

// ============ Request/Response Schemas ============
const CalculateFeeRequestSchema = z.object({
  amountInUsd: z.number().positive(),
  userAddress: z.string().min(1),
  partnerId: z.string().optional(),
  savingsUsd: z.number().optional(),
  useSavingsBasedFee: z.boolean().optional().default(false),
});

const RecordTransactionRequestSchema = z.object({
  userAddress: z.string().min(1),
  partnerId: z.string().optional(),
  tokenIn: z.string().min(1),
  tokenOut: z.string().min(1),
  amountIn: z.string().min(1),
  amountOut: z.string().min(1),
  ttvUsd: z.number().positive(),
  savingsUsd: z.number().nonnegative(),
  chainId: z.number().positive(),
  txHash: z.string().optional(),
});

const RegisterPartnerRequestSchema = z.object({
  partnerId: z.string().min(1),
  partnerName: z.string().min(1),
  sharePercent: z.number().min(0).max(100).optional().default(30),
});

const PremiumFeatureRequestSchema = z.object({
  featureId: z.string().min(1),
  usageCount: z.number().positive().optional().default(1),
});

const WhiteLabelPricingRequestSchema = z.object({
  partnerId: z.string().min(1),
  expectedVolumeUsd: z.number().positive(),
});

// ============ Routes ============
export async function monetizationRoutes(fastify: FastifyInstance) {
  
  // ============ Fee Calculation ============
  
  /**
   * POST /api/monetization/calculate-fee
   * 서비스 수수료 계산
   */
  fastify.post('/calculate-fee', {
    try {
      const { amountInUsd, userAddress, partnerId, savingsUsd, useSavingsBasedFee } = request.body as z.infer<typeof CalculateFeeRequestSchema>;

      let feeData;
      
      if (useSavingsBasedFee && savingsUsd && savingsUsd > 0) {
        // 절감액 기반 수수료 계산
        feeData = await monetizationService.calculateSavingsBasedFee(
          amountInUsd,
          savingsUsd,
          userAddress,
          partnerId
        );
      } else {
        // 일반 수수료 계산
        feeData = await monetizationService.calculateServiceFee(
          amountInUsd,
          userAddress,
          partnerId
        );
      }

      // 수수료 분해 정보 생성
      const feeBreakdown = {
        baseFeeUsd: (amountInUsd * 5) / 10000, // 0.05%
        volumeDiscountUsd: 0, // 실제로는 계산 필요
        partnerDiscountUsd: 0, // 실제로는 계산 필요
        finalFeeUsd: feeData.serviceFeeUsd,
      };

      return {
        success: true,
        data: {
          ...feeData,
          feeBreakdown,
        },
      };

    } catch (error) {
      fastify.log.error('Fee calculation error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to calculate service fee',
      });
    }
  });

  // ============ Transaction Recording ============
  
  /**
   * POST /api/monetization/record-transaction
   * 거래 기록 저장
   */
  fastify.post('/record-transaction', {
    try {
      const {
        userAddress,
        partnerId,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        ttvUsd,
        savingsUsd,
        chainId,
        txHash,
      } = request.body as z.infer<typeof RecordTransactionRequestSchema>;

      // 수수료 계산
      const feeData = await monetizationService.calculateServiceFee(
        ttvUsd,
        userAddress,
        partnerId
      );

      // 거래 기록 저장
      const transaction = await monetizationService.recordTransaction(
        userAddress,
        partnerId,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        feeData.serviceFeeUsd,
        feeData.partnerRevenueUsd,
        feeData.platformRevenueUsd,
        ttvUsd,
        savingsUsd,
        chainId,
        txHash
      );

      return {
        success: true,
        data: {
          transactionId: transaction.id,
          serviceFeeUsd: transaction.serviceFeeUsd,
          partnerRevenueUsd: transaction.partnerRevenueUsd,
          platformRevenueUsd: transaction.platformRevenueUsd,
        },
      };

    } catch (error) {
      fastify.log.error('Transaction recording error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to record transaction',
      });
    }
  });

  // ============ Partner Management ============
  
  /**
   * POST /api/monetization/partners
   * 파트너 등록
   */
  fastify.post('/partners', {
    try {
      const { partnerId, partnerName, sharePercent } = request.body as z.infer<typeof RegisterPartnerRequestSchema>;

      const partner = await monetizationService.registerPartner(
        partnerId,
        partnerName,
        sharePercent
      );

      return {
        success: true,
        data: partner,
      };

    } catch (error) {
      fastify.log.error('Partner registration error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to register partner',
      });
    }
  });

  /**
   * GET /api/monetization/partners
   * 파트너 목록 조회
   */
  fastify.get('/partners', {
    try {
      const partners = await monetizationService.getPartners();

      return {
        success: true,
        data: partners,
      };

    } catch (error) {
      fastify.log.error('Partners fetch error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch partners',
      });
    }
  });

  /**
   * GET /api/monetization/partners/:partnerId
   * 파트너 상세 조회
   */
  fastify.get('/partners/:partnerId', {
    try {
      const { partnerId } = request.params as { partnerId: string };

      const partner = await monetizationService.getPartner(partnerId);

      if (!partner) {
        return reply.status(404).send({
          success: false,
          error: 'Partner not found',
        });
      }

      return {
        success: true,
        data: partner,
      };

    } catch (error) {
      fastify.log.error('Partner fetch error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch partner',
      });
    }
  });

  // ============ Premium Features ============
  
  /**
   * GET /api/monetization/premium-features
   * 프리미엄 기능 목록 조회
   */
  fastify.get('/premium-features', {
    try {
      const features = await monetizationService.getPremiumFeatures();

      return {
        success: true,
        data: features,
      };

    } catch (error) {
      fastify.log.error('Premium features fetch error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch premium features',
      });
    }
  });

  /**
   * POST /api/monetization/premium-features/calculate-price
   * 프리미엄 기능 가격 계산
   */
  fastify.post('/premium-features/calculate-price', {
    try {
      const { featureId, usageCount } = request.body as z.infer<typeof PremiumFeatureRequestSchema>;

      const priceData = await monetizationService.calculatePremiumFeaturePrice(
        featureId,
        usageCount
      );

      return {
        success: true,
        data: priceData,
      };

    } catch (error) {
      fastify.log.error('Premium feature price calculation error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to calculate premium feature price',
      });
    }
  });

  // ============ White Label Pricing ============
  
  /**
   * POST /api/monetization/white-label/pricing
   * 화이트라벨 가격 계산
   */
  fastify.post('/white-label/pricing', {
    try {
      const { partnerId, expectedVolumeUsd } = request.body as z.infer<typeof WhiteLabelPricingRequestSchema>;

      const pricing = await monetizationService.calculateWhiteLabelPrice(
        partnerId,
        expectedVolumeUsd
      );

      // 가격 분해 정보
      const pricingBreakdown = {
        setupFee: 0, // 초기 설정비
        monthlyFee: pricing.monthlyFeeUsd,
        revenueShare: (expectedVolumeUsd * pricing.revenueSharePercent) / 100 / 12,
        supportFee: 0, // 지원비
      };

      return {
        success: true,
        data: {
          ...pricing,
          pricingBreakdown,
        },
      };

    } catch (error) {
      fastify.log.error('White label pricing calculation error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to calculate white label pricing',
      });
    }
  });

  // ============ Revenue Analytics ============
  
  /**
   * GET /api/monetization/analytics
   * 수익 분석 데이터 조회
   */
  fastify.get('/analytics', {
    try {
      const { period = '30d' } = request.query as { period?: string };

      const analytics = await monetizationService.generateRevenueAnalytics(period);

      return {
        success: true,
        data: analytics,
      };

    } catch (error) {
      fastify.log.error('Revenue analytics error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate revenue analytics',
      });
    }
  });

  // ============ Fee Structure Management ============
  
  /**
   * GET /api/monetization/fee-structure
   * 현재 수수료 구조 조회
   */
  fastify.get('/fee-structure', {
    try {
      const feeStructure = await monetizationService.getFeeStructure();

      return {
        success: true,
        data: feeStructure,
      };

    } catch (error) {
      fastify.log.error('Fee structure fetch error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch fee structure',
      });
    }
  });
}