import { PriceData, DepegAlert } from 'shared'

export class PriceOracleService {
  private prices: Map<string, PriceData> = new Map()
  private depegAlerts: Map<string, DepegAlert> = new Map()

  /**
   * 토큰 가격 조회
   */
  async getTokenPrice(tokenAddress: string, chainId: number): Promise<number | null> {
    const key = `${chainId}-${tokenAddress}`
    const priceData = this.prices.get(key)
    
    if (priceData && this.isPriceFresh(priceData)) {
      return priceData.price
    }

    // 실제로는 외부 API에서 가격 조회
    const price = await this.fetchPriceFromAPI(tokenAddress, chainId)
    
    if (price) {
      this.prices.set(key, {
        price,
        timestamp: Date.now(),
        source: 'external_api',
        isValid: true,
      })
    }

    return price
  }

  /**
   * KRW 환율 조회
   */
  async getKRWExchangeRate(): Promise<number> {
    // 실제로는 환율 API에서 조회
    return 1300 // USD to KRW
  }

  /**
   * 디페그 감지
   */
  async detectDepeg(tokenAddress: string, chainId: number): Promise<DepegAlert | null> {
    const price = await this.getTokenPrice(tokenAddress, chainId)
    if (!price) return null

    const targetPrice = 1.0 // USD 기준 $1.00
    const deviationBps = Math.abs((price - targetPrice) / targetPrice) * 10000
    const thresholdBps = 50 // 0.5% 임계값

    if (deviationBps > thresholdBps) {
      const alert: DepegAlert = {
        tokenAddress,
        symbol: await this.getTokenSymbol(tokenAddress, chainId),
        currentPrice: price,
        targetPrice,
        deviationBps,
        thresholdBps,
        severity: deviationBps > thresholdBps * 2 ? 'critical' : 'warning',
        timestamp: Date.now(),
      }

      this.depegAlerts.set(tokenAddress, alert)
      return alert
    }

    return null
  }

  /**
   * 가격이 신선한지 확인
   */
  private isPriceFresh(priceData: PriceData): boolean {
    const maxAge = 60000 // 1분
    return Date.now() - priceData.timestamp < maxAge
  }

  /**
   * 외부 API에서 가격 조회
   */
  private async fetchPriceFromAPI(tokenAddress: string, chainId: number): Promise<number | null> {
    try {
      // 실제로는 CoinGecko, CoinMarketCap 등의 API 사용
      // 여기서는 모의 데이터 반환
      const mockPrices: Record<string, number> = {
        '0xA0b86a33E6441b8c4C8C0E4b8c4C8C0E4b8c4C8C0': 1.0, // USDC
        '0xdAC17F958D2ee523a2206206994597C13D831ec7': 1.0, // USDT
        '0x6B175474E89094C44Da98b954EedeAC495271d0F': 1.0, // DAI
      }

      return mockPrices[tokenAddress] || null
    } catch (error) {
      console.error('Failed to fetch price:', error)
      return null
    }
  }

  /**
   * 토큰 심볼 조회
   */
  private async getTokenSymbol(tokenAddress: string, chainId: number): Promise<string> {
    // 실제로는 컨트랙트에서 조회
    const mockSymbols: Record<string, string> = {
      '0xA0b86a33E6441b8c4C8C0E4b8c4C8C0E4b8c4C8C0': 'USDC',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'USDT',
      '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'DAI',
    }

    return mockSymbols[tokenAddress] || 'UNKNOWN'
  }

  /**
   * 모든 가격 데이터 조회
   */
  getAllPrices(): Map<string, PriceData> {
    return this.prices
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