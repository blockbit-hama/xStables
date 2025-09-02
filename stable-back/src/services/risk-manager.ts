import { 
  RiskThreshold, 
  TokenRiskProfile, 
  DepegAlert, 
  LiquidityRisk, 
  RiskAssessment 
} from 'shared'
import { KRW_RISK_THRESHOLDS } from 'shared'
import { PriceOracleService } from './price-oracle'

export class RiskManager {
  private riskThresholds: Map<string, RiskThreshold> = new Map()
  private tokenRiskProfiles: Map<string, TokenRiskProfile> = new Map()
  private depegAlerts: Map<string, DepegAlert> = new Map()
  private liquidityRisks: Map<string, LiquidityRisk> = new Map()
  private priceOracle: PriceOracleService

  constructor(priceOracle: PriceOracleService) {
    this.priceOracle = priceOracle
    this.initializeDefaultThresholds()
  }

  /**
   * 기본 리스크 임계값 초기화
   */
  private initializeDefaultThresholds(): void {
    // KRW 스테이블 전용 임계값
    this.riskThresholds.set('KRW_STABLE', KRW_RISK_THRESHOLDS)
    
    // 일반 스테이블코인 임계값
    this.riskThresholds.set('DEFAULT', {
      depegThresholdBps: 200, // 2%
      minTvlUsd: 1000000, // $1M
      maxSlippageBps: 500, // 5%
      maxVolumeUsd: 10000000, // $10M
      minLiquidityUsd: 500000, // $500K
    })
  }

  /**
   * 토큰 리스크 평가
   */
  async assessTokenRisk(
    tokenAddress: string,
    amountUsd: number,
    chainId: number
  ): Promise<RiskAssessment> {
    const tokenProfile = await this.getTokenRiskProfile(tokenAddress, chainId)
    const riskFactors = []
    const warnings = []
    let overallRiskScore = 0

    // 디페그 리스크 체크
    const depegRisk = await this.checkDepegRisk(tokenAddress, chainId)
    if (depegRisk) {
      riskFactors.push({
        type: 'depeg' as const,
        severity: depegRisk.severity,
        description: `Depeg detected: ${depegRisk.deviationBps}bps deviation`,
        lastUpdated: Date.now(),
      })
      overallRiskScore += depegRisk.severity === 'critical' ? 40 : 20
    }

    // 유동성 리스크 체크
    const liquidityRisk = await this.checkLiquidityRisk(tokenAddress, amountUsd, chainId)
    if (liquidityRisk) {
      riskFactors.push({
        type: 'low_liquidity' as const,
        severity: liquidityRisk.priceImpact > 5 ? 'high' : 'medium',
        description: `Low liquidity: ${liquidityRisk.priceImpact}% price impact`,
        lastUpdated: Date.now(),
      })
      overallRiskScore += liquidityRisk.priceImpact > 5 ? 30 : 15
    }

    // 슬리피지 리스크 체크
    const slippageRisk = await this.checkSlippageRisk(tokenAddress, amountUsd, chainId)
    if (slippageRisk) {
      riskFactors.push({
        type: 'high_slippage' as const,
        severity: slippageRisk > 3 ? 'high' : 'medium',
        description: `High slippage: ${slippageRisk}% expected`,
        lastUpdated: Date.now(),
      })
      overallRiskScore += slippageRisk > 3 ? 25 : 10
    }

    // 블랙리스트 체크
    if (tokenProfile.isBlacklisted) {
      riskFactors.push({
        type: 'blacklist' as const,
        severity: 'critical',
        description: 'Token is blacklisted',
        lastUpdated: Date.now(),
      })
      overallRiskScore = 100 // 즉시 차단
    }

    // 권장사항 생성
    const recommendations = this.generateRecommendations(riskFactors, amountUsd)
    
    // 경고 메시지 생성
    if (overallRiskScore > 70) {
      warnings.push('High risk transaction - consider alternative routes')
    }
    if (depegRisk && depegRisk.severity === 'critical') {
      warnings.push('Critical depeg detected - transaction blocked')
    }

    const riskLevel = this.calculateRiskLevel(overallRiskScore)
    const canProceed = overallRiskScore < 80 && !tokenProfile.isBlacklisted

    return {
      overallRiskScore,
      riskLevel,
      recommendations,
      warnings,
      canProceed,
      alternativeRoutes: canProceed ? [] : await this.getAlternativeRoutes(tokenAddress, chainId),
    }
  }

  /**
   * 디페그 리스크 체크
   */
  private async checkDepegRisk(
    tokenAddress: string,
    chainId: number
  ): Promise<DepegAlert | null> {
    const price = await this.priceOracle.getTokenPrice(tokenAddress, chainId)
    if (!price) return null

    const threshold = this.getRiskThreshold(tokenAddress)
    const targetPrice = 1.0 // USD 기준 $1.00
    const deviationBps = Math.abs((price - targetPrice) / targetPrice) * 10000

    if (deviationBps > threshold.depegThresholdBps) {
      const alert: DepegAlert = {
        tokenAddress,
        symbol: '', // 토큰 심볼 조회 필요
        currentPrice: price,
        targetPrice,
        deviationBps,
        thresholdBps: threshold.depegThresholdBps,
        severity: deviationBps > threshold.depegThresholdBps * 2 ? 'critical' : 'warning',
        timestamp: Date.now(),
      }

      this.depegAlerts.set(tokenAddress, alert)
      return alert
    }

    return null
  }

  /**
   * 유동성 리스크 체크
   */
  private async checkLiquidityRisk(
    tokenAddress: string,
    amountUsd: number,
    chainId: number
  ): Promise<LiquidityRisk | null> {
    // 실제로는 DEX 풀 데이터를 조회해야 함
    const mockTvl = 1000000 // $1M TVL
    const threshold = this.getRiskThreshold(tokenAddress)
    
    if (mockTvl < threshold.minTvlUsd) {
      const priceImpact = (amountUsd / mockTvl) * 100
      
      return {
        tokenAddress,
        poolAddress: '', // 풀 주소 조회 필요
        currentTvl: mockTvl,
        minTvl: threshold.minTvlUsd,
        priceImpact,
        maxTradeSize: mockTvl * 0.1, // TVL의 10%
        lastUpdated: Date.now(),
      }
    }

    return null
  }

  /**
   * 슬리피지 리스크 체크
   */
  private async checkSlippageRisk(
    tokenAddress: string,
    amountUsd: number,
    chainId: number
  ): Promise<number> {
    // 실제로는 AMM 수식을 사용하여 슬리피지 계산
    const threshold = this.getRiskThreshold(tokenAddress)
    const mockSlippage = (amountUsd / 1000000) * 100 // 간단한 계산
    
    return mockSlippage > threshold.maxSlippageBps / 100 ? mockSlippage : 0
  }

  /**
   * 토큰 리스크 프로필 조회
   */
  private async getTokenRiskProfile(
    tokenAddress: string,
    chainId: number
  ): Promise<TokenRiskProfile> {
    const existing = this.tokenRiskProfiles.get(tokenAddress)
    if (existing && Date.now() - existing.lastRiskCheck < 300000) { // 5분 캐시
      return existing
    }

    // 새로운 리스크 프로필 생성
    const profile: TokenRiskProfile = {
      tokenAddress,
      symbol: '', // 토큰 심볼 조회 필요
      riskScore: 0,
      riskFactors: [],
      isWhitelisted: this.isWhitelisted(tokenAddress),
      isBlacklisted: this.isBlacklisted(tokenAddress),
      lastRiskCheck: Date.now(),
    }

    this.tokenRiskProfiles.set(tokenAddress, profile)
    return profile
  }

  /**
   * 화이트리스트 체크
   */
  private isWhitelisted(tokenAddress: string): boolean {
    // 실제로는 데이터베이스에서 조회
    const whitelistedTokens = [
      '0xA0b86a33E6441b8c4C8C0E4b8c4C8C0E4b8c4C8C0', // USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    ]
    return whitelistedTokens.includes(tokenAddress)
  }

  /**
   * 블랙리스트 체크
   */
  private isBlacklisted(tokenAddress: string): boolean {
    // 실제로는 OFAC 리스트 등에서 조회
    return false
  }

  /**
   * 리스크 임계값 조회
   */
  private getRiskThreshold(tokenAddress: string): RiskThreshold {
    // KRW 스테이블인지 확인
    if (this.isKRWStable(tokenAddress)) {
      return this.riskThresholds.get('KRW_STABLE')!
    }
    return this.riskThresholds.get('DEFAULT')!
  }

  /**
   * KRW 스테이블 여부 확인
   */
  private isKRWStable(tokenAddress: string): boolean {
    // 실제로는 토큰 메타데이터에서 확인
    return false
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(
    riskFactors: any[],
    amountUsd: number
  ): string[] {
    const recommendations = []

    if (riskFactors.some(f => f.type === 'depeg')) {
      recommendations.push('Consider waiting for price stabilization')
    }

    if (riskFactors.some(f => f.type === 'low_liquidity')) {
      recommendations.push('Split transaction into smaller amounts')
    }

    if (riskFactors.some(f => f.type === 'high_slippage')) {
      recommendations.push('Use limit order or wait for better liquidity')
    }

    if (amountUsd > 100000) {
      recommendations.push('Consider using RFQ for large amounts')
    }

    return recommendations
  }

  /**
   * 리스크 레벨 계산
   */
  private calculateRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore < 25) return 'low'
    if (riskScore < 50) return 'medium'
    if (riskScore < 75) return 'high'
    return 'critical'
  }

  /**
   * 대안 경로 조회
   */
  private async getAlternativeRoutes(
    tokenAddress: string,
    chainId: number
  ): Promise<string[]> {
    // 실제로는 다른 경로들을 조회
    return ['USDC', 'USDT', 'DAI']
  }

  /**
   * 리스크 임계값 업데이트
   */
  updateRiskThreshold(category: string, threshold: RiskThreshold): void {
    this.riskThresholds.set(category, threshold)
  }

  /**
   * 디페그 알림 조회
   */
  getDepegAlerts(): DepegAlert[] {
    return Array.from(this.depegAlerts.values())
  }

  /**
   * 활성 디페그 알림 조회
   */
  getActiveDepegAlerts(): DepegAlert[] {
    return Array.from(this.depegAlerts.values()).filter(alert => !alert.isResolved)
  }
}