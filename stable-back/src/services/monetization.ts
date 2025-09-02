import { FeeStructure, RevenueShare, PremiumFeature, TransactionReceipt } from 'shared'
import { config } from '../config'

export class MonetizationService {
  private feeStructure: FeeStructure
  private revenueShares: Map<string, RevenueShare> = new Map()
  private premiumFeatures: Map<string, PremiumFeature> = new Map()

  constructor() {
    this.feeStructure = {
      serviceFeeBps: 5, // 0.05% 기본 수수료
      maxFeeUsd: 10, // 최대 $10
      minFeeUsd: 0.01, // 최소 $0.01
      savingsBasedFee: true,
      savingsFeeRatio: 0.3, // 절감액의 30%
    }
  }

  /**
   * 거래 수수료 계산
   */
  calculateServiceFee(
    amountUsd: number,
    savingsUsd: number,
    partnerId?: string
  ): number {
    let fee = 0

    // 기본 수수료 계산
    const baseFee = (amountUsd * this.feeStructure.serviceFeeBps) / 10000

    // 절감액 기반 수수료 (더 유리한 쪽 선택)
    if (this.feeStructure.savingsBasedFee && savingsUsd > 0) {
      const savingsBasedFee = savingsUsd * this.feeStructure.savingsFeeRatio
      fee = Math.min(baseFee, savingsBasedFee)
    } else {
      fee = baseFee
    }

    // 파트너 할인 적용
    if (partnerId) {
      const revenueShare = this.revenueShares.get(partnerId)
      if (revenueShare && revenueShare.isActive) {
        // 파트너는 수수료 할인 (예: 50% 할인)
        fee *= 0.5
      }
    }

    // 최소/최대 수수료 적용
    fee = Math.max(fee, this.feeStructure.minFeeUsd || 0)
    fee = Math.min(fee, this.feeStructure.maxFeeUsd || Infinity)

    return fee
  }

  /**
   * 수익 분배 계산
   */
  calculateRevenueShare(
    totalFee: number,
    partnerId: string
  ): { partnerShare: number; platformShare: number } {
    const revenueShare = this.revenueShares.get(partnerId)
    
    if (!revenueShare || !revenueShare.isActive) {
      return { partnerShare: 0, platformShare: totalFee }
    }

    const partnerShare = totalFee * revenueShare.sharePercentage
    const platformShare = totalFee - partnerShare

    return { partnerShare, platformShare }
  }

  /**
   * 프리미엄 기능 가격 계산
   */
  calculatePremiumFeaturePrice(
    featureName: string,
    usageCount: number = 1
  ): number {
    const feature = this.premiumFeatures.get(featureName)
    
    if (!feature || !feature.isActive) {
      return 0
    }

    switch (feature.billingType) {
      case 'per_transaction':
        return feature.priceUsd * usageCount
      case 'monthly':
        return feature.priceUsd
      case 'yearly':
        return feature.priceUsd
      default:
        return 0
    }
  }

  /**
   * 거래 영수증 생성
   */
  generateTransactionReceipt(
    transactionData: {
      transactionId: string
      fromToken: string
      toToken: string
      amountIn: string
      amountOut: string
      route: string
      provider: string
      costBreakdown: {
        gasUsd: number
        protocolFeesUsd: number
        aggregatorFeesUsd: number
        slippageUsd: number
      }
      savings: {
        vsBestAlternative: number
        vsTraditionalExchange: number
      }
      riskScore: number
      partnerId?: string
    }
  ): TransactionReceipt {
    const serviceFee = this.calculateServiceFee(
      parseFloat(transactionData.amountIn),
      transactionData.savings.vsBestAlternative,
      transactionData.partnerId
    )

    const totalCost = 
      transactionData.costBreakdown.gasUsd +
      transactionData.costBreakdown.protocolFeesUsd +
      transactionData.costBreakdown.aggregatorFeesUsd +
      serviceFee +
      transactionData.costBreakdown.slippageUsd

    const savingsPercentage = transactionData.savings.vsTraditionalExchange > 0
      ? (transactionData.savings.vsTraditionalExchange / parseFloat(transactionData.amountIn)) * 100
      : 0

    return {
      transactionId: transactionData.transactionId,
      timestamp: Date.now(),
      fromToken: transactionData.fromToken,
      toToken: transactionData.toToken,
      amountIn: transactionData.amountIn,
      amountOut: transactionData.amountOut,
      route: transactionData.route,
      provider: transactionData.provider,
      costBreakdown: {
        gasUsd: transactionData.costBreakdown.gasUsd,
        protocolFeesUsd: transactionData.costBreakdown.protocolFeesUsd,
        aggregatorFeesUsd: transactionData.costBreakdown.aggregatorFeesUsd,
        serviceFeesUsd: serviceFee,
        slippageUsd: transactionData.costBreakdown.slippageUsd,
        totalCostUsd: totalCost,
      },
      savings: {
        vsBestAlternative: transactionData.savings.vsBestAlternative,
        vsTraditionalExchange: transactionData.savings.vsTraditionalExchange,
        savingsPercentage,
      },
      riskScore: transactionData.riskScore,
      partnerId: transactionData.partnerId,
    }
  }

  /**
   * 수수료 구조 업데이트
   */
  updateFeeStructure(newFeeStructure: Partial<FeeStructure>): void {
    this.feeStructure = { ...this.feeStructure, ...newFeeStructure }
  }

  /**
   * 수익 분배 파트너 추가
   */
  addRevenueSharePartner(revenueShare: RevenueShare): void {
    this.revenueShares.set(revenueShare.partnerId, revenueShare)
  }

  /**
   * 프리미엄 기능 추가
   */
  addPremiumFeature(feature: PremiumFeature): void {
    this.premiumFeatures.set(feature.name, feature)
  }

  /**
   * 현재 수수료 구조 조회
   */
  getFeeStructure(): FeeStructure {
    return this.feeStructure
  }

  /**
   * 파트너별 수익 분배 조회
   */
  getRevenueShare(partnerId: string): RevenueShare | undefined {
    return this.revenueShares.get(partnerId)
  }

  /**
   * 프리미엄 기능 조회
   */
  getPremiumFeature(featureName: string): PremiumFeature | undefined {
    return this.premiumFeatures.get(featureName)
  }
}