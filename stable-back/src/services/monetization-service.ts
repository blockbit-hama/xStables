import { z } from 'zod';
import { ttvEngine } from './ttv-engine';

// ============ Types ============
export const FeeStructureSchema = z.object({
  serviceFeeBps: z.number(), // 0.05% = 5 bps
  minFeeUsd: z.number(), // 최소 $0.01
  maxFeeUsd: z.number(), // 최대 $10
  partnerSharePercent: z.number(), // 30%
  volumeDiscountTiers: z.array(z.object({
    volumeUsd: z.number(),
    discountBps: z.number(),
  })),
});

export const PartnerRevenueSchema = z.object({
  partnerId: z.string(),
  partnerName: z.string(),
  sharePercent: z.number(),
  totalVolumeUsd: z.number(),
  totalRevenueUsd: z.number(),
  transactionCount: z.number(),
  lastTransactionTime: z.number(),
  isActive: z.boolean(),
});

export const TransactionRecordSchema = z.object({
  id: z.string(),
  userAddress: z.string(),
  partnerId: z.string().optional(),
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.string(),
  amountOut: z.string(),
  serviceFeeUsd: z.number(),
  partnerRevenueUsd: z.number(),
  platformRevenueUsd: z.number(),
  ttvUsd: z.number(),
  savingsUsd: z.number(),
  timestamp: z.number(),
  chainId: z.number(),
  txHash: z.string().optional(),
});

export const PremiumFeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  priceUsd: z.number(),
  priceType: z.enum(['per_transaction', 'monthly', 'yearly']),
  isActive: z.boolean(),
  features: z.array(z.string()),
});

export const RevenueAnalyticsSchema = z.object({
  period: z.string(),
  totalVolumeUsd: z.number(),
  totalRevenueUsd: z.number(),
  platformRevenueUsd: z.number(),
  partnerRevenueUsd: z.number(),
  transactionCount: z.number(),
  averageTransactionSize: z.number(),
  topPartners: z.array(PartnerRevenueSchema),
  revenueByChain: z.record(z.number()),
  revenueByToken: z.record(z.number()),
});

export type FeeStructure = z.infer<typeof FeeStructureSchema>;
export type PartnerRevenue = z.infer<typeof PartnerRevenueSchema>;
export type TransactionRecord = z.infer<typeof TransactionRecordSchema>;
export type PremiumFeature = z.infer<typeof PremiumFeatureSchema>;
export type RevenueAnalytics = z.infer<typeof RevenueAnalyticsSchema>;

// ============ Monetization Service ============
export class MonetizationService {
  private feeStructure: FeeStructure;
  private partners: Map<string, PartnerRevenue> = new Map();
  private transactions: Map<string, TransactionRecord> = new Map();
  private premiumFeatures: Map<string, PremiumFeature> = new Map();
  private volumeDiscounts: Map<string, number> = new Map(); // userAddress -> discountBps

  constructor() {
    this.initializeFeeStructure();
    this.initializePremiumFeatures();
  }

  // ============ Initialization ============
  private initializeFeeStructure() {
    this.feeStructure = {
      serviceFeeBps: 5, // 0.05%
      minFeeUsd: 0.01, // $0.01
      maxFeeUsd: 10, // $10
      partnerSharePercent: 30, // 30%
      volumeDiscountTiers: [
        { volumeUsd: 10000, discountBps: 0 }, // $10K 이상: 할인 없음
        { volumeUsd: 50000, discountBps: 10 }, // $50K 이상: 0.1% 할인
        { volumeUsd: 100000, discountBps: 20 }, // $100K 이상: 0.2% 할인
        { volumeUsd: 500000, discountBps: 30 }, // $500K 이상: 0.3% 할인
        { volumeUsd: 1000000, discountBps: 50 }, // $1M 이상: 0.5% 할인
      ],
    };
  }

  private initializePremiumFeatures() {
    const features: PremiumFeature[] = [
      {
        id: 'mev_protection',
        name: 'MEV Protection',
        description: '프라이빗 트랜잭션 제출로 MEV 공격 방지',
        priceUsd: 0.5,
        priceType: 'per_transaction',
        isActive: true,
        features: ['Private mempool', 'Bundle submission', 'MEV protection'],
      },
      {
        id: 'gasless_transaction',
        name: 'Gasless Transaction',
        description: '가스비 대행 서비스',
        priceUsd: 0.1,
        priceType: 'per_transaction',
        isActive: true,
        features: ['Gas sponsorship', 'Meta transactions', 'No gas required'],
      },
      {
        id: 'priority_routing',
        name: 'Priority Routing',
        description: '우선 라우팅 및 빠른 처리',
        priceUsd: 9.99,
        priceType: 'monthly',
        isActive: true,
        features: ['Priority queue', 'Faster execution', 'SLA guarantee'],
      },
      {
        id: 'advanced_analytics',
        name: 'Advanced Analytics',
        description: '고급 거래 분석 및 리포팅',
        priceUsd: 19.99,
        priceType: 'monthly',
        isActive: true,
        features: ['Detailed reports', 'Portfolio tracking', 'Tax reporting'],
      },
    ];

    features.forEach(feature => {
      this.premiumFeatures.set(feature.id, feature);
    });
  }

  // ============ Core Fee Calculation ============

  /**
   * 서비스 수수료 계산
   */
  async calculateServiceFee(
    amountInUsd: number,
    userAddress: string,
    partnerId?: string
  ): Promise<{
    serviceFeeUsd: number;
    partnerRevenueUsd: number;
    platformRevenueUsd: number;
    effectiveFeeBps: number;
  }> {
    try {
      // 1. 기본 수수료 계산
      let effectiveFeeBps = this.feeStructure.serviceFeeBps;

      // 2. 볼륨 할인 적용
      const volumeDiscount = await this.getVolumeDiscount(userAddress);
      effectiveFeeBps = Math.max(0, effectiveFeeBps - volumeDiscount);

      // 3. 파트너 할인 적용
      if (partnerId) {
        const partnerDiscount = await this.getPartnerDiscount(partnerId);
        effectiveFeeBps = Math.max(0, effectiveFeeBps - partnerDiscount);
      }

      // 4. 수수료 금액 계산
      let serviceFeeUsd = (amountInUsd * effectiveFeeBps) / 10000;

      // 5. 최소/최대 수수료 적용
      serviceFeeUsd = Math.max(this.feeStructure.minFeeUsd, serviceFeeUsd);
      serviceFeeUsd = Math.min(this.feeStructure.maxFeeUsd, serviceFeeUsd);

      // 6. 파트너 수익 분배
      const partnerRevenueUsd = partnerId 
        ? (serviceFeeUsd * this.feeStructure.partnerSharePercent) / 100
        : 0;
      
      const platformRevenueUsd = serviceFeeUsd - partnerRevenueUsd;

      return {
        serviceFeeUsd,
        partnerRevenueUsd,
        platformRevenueUsd,
        effectiveFeeBps,
      };

    } catch (error) {
      console.error('Service fee calculation error:', error);
      throw new Error('Failed to calculate service fee');
    }
  }

  /**
   * 절감액 기반 수수료 계산
   */
  async calculateSavingsBasedFee(
    amountInUsd: number,
    savingsUsd: number,
    userAddress: string,
    partnerId?: string
  ): Promise<{
    serviceFeeUsd: number;
    partnerRevenueUsd: number;
    platformRevenueUsd: number;
    savingsSharePercent: number;
  }> {
    try {
      // 절감액의 30%를 수수료로 설정 (최대 절감액의 50%)
      const savingsSharePercent = 30;
      const maxSavingsSharePercent = 50;
      
      let serviceFeeUsd = (savingsUsd * savingsSharePercent) / 100;
      const maxFeeFromSavings = (savingsUsd * maxSavingsSharePercent) / 100;
      
      // 절감액 기반 수수료 상한 적용
      serviceFeeUsd = Math.min(serviceFeeUsd, maxFeeFromSavings);
      
      // 최소/최대 수수료 적용
      serviceFeeUsd = Math.max(this.feeStructure.minFeeUsd, serviceFeeUsd);
      serviceFeeUsd = Math.min(this.feeStructure.maxFeeUsd, serviceFeeUsd);

      // 파트너 수익 분배
      const partnerRevenueUsd = partnerId 
        ? (serviceFeeUsd * this.feeStructure.partnerSharePercent) / 100
        : 0;
      
      const platformRevenueUsd = serviceFeeUsd - partnerRevenueUsd;

      return {
        serviceFeeUsd,
        partnerRevenueUsd,
        platformRevenueUsd,
        savingsSharePercent,
      };

    } catch (error) {
      console.error('Savings-based fee calculation error:', error);
      throw new Error('Failed to calculate savings-based fee');
    }
  }

  // ============ Volume Discount Management ============

  private async getVolumeDiscount(userAddress: string): Promise<number> {
    try {
      // 사용자의 30일 거래량 조회
      const volume30Days = await this.getUserVolume30Days(userAddress);
      
      // 볼륨 티어에 따른 할인 적용
      for (let i = this.feeStructure.volumeDiscountTiers.length - 1; i >= 0; i--) {
        const tier = this.feeStructure.volumeDiscountTiers[i];
        if (volume30Days >= tier.volumeUsd) {
          return tier.discountBps;
        }
      }
      
      return 0;
    } catch (error) {
      console.error('Volume discount calculation error:', error);
      return 0;
    }
  }

  private async getUserVolume30Days(userAddress: string): Promise<number> {
    try {
      // 실제로는 데이터베이스에서 조회
      // 여기서는 캐시된 값 사용
      const cached = this.volumeDiscounts.get(userAddress);
      return cached || 0;
    } catch (error) {
      console.error('User volume calculation error:', error);
      return 0;
    }
  }

  private async getPartnerDiscount(partnerId: string): Promise<number> {
    try {
      const partner = this.partners.get(partnerId);
      if (!partner || !partner.isActive) return 0;

      // 파트너 볼륨에 따른 추가 할인
      if (partner.totalVolumeUsd >= 1000000) return 10; // 0.1% 추가 할인
      if (partner.totalVolumeUsd >= 500000) return 5; // 0.05% 추가 할인
      
      return 0;
    } catch (error) {
      console.error('Partner discount calculation error:', error);
      return 0;
    }
  }

  // ============ Partner Management ============

  /**
   * 파트너 등록
   */
  async registerPartner(
    partnerId: string,
    partnerName: string,
    sharePercent: number = 30
  ): Promise<PartnerRevenue> {
    try {
      const partner: PartnerRevenue = {
        partnerId,
        partnerName,
        sharePercent,
        totalVolumeUsd: 0,
        totalRevenueUsd: 0,
        transactionCount: 0,
        lastTransactionTime: 0,
        isActive: true,
      };

      this.partners.set(partnerId, partner);
      return partner;

    } catch (error) {
      console.error('Partner registration error:', error);
      throw new Error('Failed to register partner');
    }
  }

  /**
   * 파트너 수익 업데이트
   */
  async updatePartnerRevenue(
    partnerId: string,
    volumeUsd: number,
    revenueUsd: number
  ): Promise<void> {
    try {
      const partner = this.partners.get(partnerId);
      if (!partner) return;

      partner.totalVolumeUsd += volumeUsd;
      partner.totalRevenueUsd += revenueUsd;
      partner.transactionCount += 1;
      partner.lastTransactionTime = Date.now();

      this.partners.set(partnerId, partner);

    } catch (error) {
      console.error('Partner revenue update error:', error);
    }
  }

  /**
   * 파트너 목록 조회
   */
  async getPartners(): Promise<PartnerRevenue[]> {
    return Array.from(this.partners.values());
  }

  /**
   * 파트너 상세 조회
   */
  async getPartner(partnerId: string): Promise<PartnerRevenue | null> {
    return this.partners.get(partnerId) || null;
  }

  // ============ Transaction Recording ============

  /**
   * 거래 기록 저장
   */
  async recordTransaction(
    userAddress: string,
    partnerId: string | undefined,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    amountOut: string,
    serviceFeeUsd: number,
    partnerRevenueUsd: number,
    platformRevenueUsd: number,
    ttvUsd: number,
    savingsUsd: number,
    chainId: number,
    txHash?: string
  ): Promise<TransactionRecord> {
    try {
      const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const transaction: TransactionRecord = {
        id: transactionId,
        userAddress,
        partnerId,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        serviceFeeUsd,
        partnerRevenueUsd,
        platformRevenueUsd,
        ttvUsd,
        savingsUsd,
        timestamp: Date.now(),
        chainId,
        txHash,
      };

      this.transactions.set(transactionId, transaction);

      // 파트너 수익 업데이트
      if (partnerId) {
        await this.updatePartnerRevenue(partnerId, ttvUsd, partnerRevenueUsd);
      }

      // 사용자 볼륨 업데이트
      await this.updateUserVolume(userAddress, ttvUsd);

      return transaction;

    } catch (error) {
      console.error('Transaction recording error:', error);
      throw new Error('Failed to record transaction');
    }
  }

  private async updateUserVolume(userAddress: string, volumeUsd: number): Promise<void> {
    try {
      const currentVolume = this.volumeDiscounts.get(userAddress) || 0;
      this.volumeDiscounts.set(userAddress, currentVolume + volumeUsd);
    } catch (error) {
      console.error('User volume update error:', error);
    }
  }

  // ============ Premium Features ============

  /**
   * 프리미엄 기능 가격 계산
   */
  async calculatePremiumFeaturePrice(
    featureId: string,
    usageCount: number = 1
  ): Promise<{
    totalPriceUsd: number;
    pricePerUnit: number;
    feature: PremiumFeature;
  }> {
    try {
      const feature = this.premiumFeatures.get(featureId);
      if (!feature || !feature.isActive) {
        throw new Error('Premium feature not available');
      }

      let totalPriceUsd: number;
      
      switch (feature.priceType) {
        case 'per_transaction':
          totalPriceUsd = feature.priceUsd * usageCount;
          break;
        case 'monthly':
          totalPriceUsd = feature.priceUsd;
          break;
        case 'yearly':
          totalPriceUsd = feature.priceUsd * 12;
          break;
        default:
          totalPriceUsd = feature.priceUsd;
      }

      return {
        totalPriceUsd,
        pricePerUnit: feature.priceUsd,
        feature,
      };

    } catch (error) {
      console.error('Premium feature price calculation error:', error);
      throw new Error('Failed to calculate premium feature price');
    }
  }

  /**
   * 프리미엄 기능 목록 조회
   */
  async getPremiumFeatures(): Promise<PremiumFeature[]> {
    return Array.from(this.premiumFeatures.values()).filter(f => f.isActive);
  }

  // ============ Revenue Analytics ============

  /**
   * 수익 분석 데이터 생성
   */
  async generateRevenueAnalytics(period: string = '30d'): Promise<RevenueAnalytics> {
    try {
      const transactions = Array.from(this.transactions.values());
      const partners = Array.from(this.partners.values());

      // 기간 필터링
      const now = Date.now();
      const periodMs = this.getPeriodMs(period);
      const filteredTransactions = transactions.filter(tx => 
        now - tx.timestamp <= periodMs
      );

      // 기본 통계
      const totalVolumeUsd = filteredTransactions.reduce((sum, tx) => sum + tx.ttvUsd, 0);
      const totalRevenueUsd = filteredTransactions.reduce((sum, tx) => sum + tx.serviceFeeUsd, 0);
      const platformRevenueUsd = filteredTransactions.reduce((sum, tx) => sum + tx.platformRevenueUsd, 0);
      const partnerRevenueUsd = filteredTransactions.reduce((sum, tx) => sum + tx.partnerRevenueUsd, 0);
      const transactionCount = filteredTransactions.length;
      const averageTransactionSize = transactionCount > 0 ? totalVolumeUsd / transactionCount : 0;

      // 상위 파트너
      const topPartners = partners
        .sort((a, b) => b.totalRevenueUsd - a.totalRevenueUsd)
        .slice(0, 10);

      // 체인별 수익
      const revenueByChain: Record<string, number> = {};
      filteredTransactions.forEach(tx => {
        const chainKey = `chain_${tx.chainId}`;
        revenueByChain[chainKey] = (revenueByChain[chainKey] || 0) + tx.serviceFeeUsd;
      });

      // 토큰별 수익
      const revenueByToken: Record<string, number> = {};
      filteredTransactions.forEach(tx => {
        revenueByToken[tx.tokenIn] = (revenueByToken[tx.tokenIn] || 0) + tx.serviceFeeUsd;
        revenueByToken[tx.tokenOut] = (revenueByToken[tx.tokenOut] || 0) + tx.serviceFeeUsd;
      });

      return {
        period,
        totalVolumeUsd,
        totalRevenueUsd,
        platformRevenueUsd,
        partnerRevenueUsd,
        transactionCount,
        averageTransactionSize,
        topPartners,
        revenueByChain,
        revenueByToken,
      };

    } catch (error) {
      console.error('Revenue analytics generation error:', error);
      throw new Error('Failed to generate revenue analytics');
    }
  }

  private getPeriodMs(period: string): number {
    switch (period) {
      case '1d': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      case '90d': return 90 * 24 * 60 * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  }

  // ============ Fee Structure Management ============

  /**
   * 수수료 구조 업데이트
   */
  async updateFeeStructure(newFeeStructure: Partial<FeeStructure>): Promise<void> {
    try {
      this.feeStructure = { ...this.feeStructure, ...newFeeStructure };
    } catch (error) {
      console.error('Fee structure update error:', error);
      throw new Error('Failed to update fee structure');
    }
  }

  /**
   * 현재 수수료 구조 조회
   */
  async getFeeStructure(): Promise<FeeStructure> {
    return this.feeStructure;
  }

  // ============ White Label Pricing ============

  /**
   * 화이트라벨 가격 계산
   */
  async calculateWhiteLabelPrice(
    partnerId: string,
    expectedVolumeUsd: number
  ): Promise<{
    monthlyFeeUsd: number;
    revenueSharePercent: number;
    totalCostUsd: number;
  }> {
    try {
      // 기본 월 수수료
      let monthlyFeeUsd = 500; // $500/월

      // 볼륨에 따른 할인
      if (expectedVolumeUsd >= 1000000) {
        monthlyFeeUsd = 200; // $200/월
      } else if (expectedVolumeUsd >= 500000) {
        monthlyFeeUsd = 300; // $300/월
      } else if (expectedVolumeUsd >= 100000) {
        monthlyFeeUsd = 400; // $400/월
      }

      // 수익 분배율 (기본 30%)
      const revenueSharePercent = 30;

      // 총 비용 (월 수수료 + 수익 분배)
      const totalCostUsd = monthlyFeeUsd + (expectedVolumeUsd * revenueSharePercent / 100 / 12);

      return {
        monthlyFeeUsd,
        revenueSharePercent,
        totalCostUsd,
      };

    } catch (error) {
      console.error('White label pricing calculation error:', error);
      throw new Error('Failed to calculate white label price');
    }
  }
}

// ============ Singleton Instance ============
export const monetizationService = new MonetizationService();