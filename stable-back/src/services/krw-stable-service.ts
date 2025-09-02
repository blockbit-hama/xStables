import { z } from 'zod';
import axios from 'axios';
import { ttvEngine } from './ttv-engine';

// ============ Types ============
export const KRWStableInfoSchema = z.object({
  address: z.string(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.number(),
  chainId: z.number(),
  pegCurrency: z.string(),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  depegThresholdBps: z.number(),
  currentPrice: z.number(),
  isDepegged: z.boolean(),
  lastUpdateTime: z.number(),
});

export const KRWRouteSchema = z.object({
  type: z.enum(['direct', 'usd_hub']),
  tokenIn: z.string(),
  tokenOut: z.string(),
  intermediateToken: z.string().optional(),
  ttvUsd: z.number(),
  savingsUsd: z.number(),
  savingsPercent: z.number(),
  isRecommended: z.boolean(),
});

export const KRWQuoteSchema = z.object({
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.string(),
  amountOut: z.string(),
  routes: z.array(KRWRouteSchema),
  bestRoute: KRWRouteSchema,
  krwOptimization: z.object({
    isDirectBetter: z.boolean(),
    directSavingsUsd: z.number(),
    directSavingsPercent: z.number(),
    recommendation: z.string(),
  }),
  depegAlerts: z.array(z.object({
    token: z.string(),
    currentPrice: z.number(),
    targetPrice: z.number(),
    deviationBps: z.number(),
    severity: z.number(),
  })),
  expiresAt: z.number(),
});

export type KRWStableInfo = z.infer<typeof KRWStableInfoSchema>;
export type KRWRoute = z.infer<typeof KRWRouteSchema>;
export type KRWQuote = z.infer<typeof KRWQuoteSchema>;

// ============ KRW Stablecoin Service ============
export class KRWStableService {
  private krwStables: Map<string, KRWStableInfo> = new Map();
  private depegAlerts: Map<string, any> = new Map();
  private usdKrwRate: number = 1300; // USD/KRW 환율 (실제로는 실시간 조회)

  constructor() {
    this.initializeKRWStables();
  }

  // ============ Initialization ============
  private initializeKRWStables() {
    // Klaytn 기반 KRW 스테이블코인들
    const krwStables = [
      {
        address: '0x6270B58BE569a7c0b8f47594F191631Ae5b2C86C',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chainId: 8217,
        pegCurrency: 'USD',
        tags: ['stable', 'usd'],
        isActive: true,
        depegThresholdBps: 50, // 0.5%
      },
      {
        address: '0xceE8FAF64bE97aF5a7016412E8a34b4932325Ee7',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        chainId: 8217,
        pegCurrency: 'USD',
        tags: ['stable', 'usd'],
        isActive: true,
        depegThresholdBps: 50,
      },
      // KRW 스테이블코인들 (실제 주소로 교체 필요)
      {
        address: '0x...', // KRWx 주소
        symbol: 'KRWx',
        name: 'KRW Stablecoin',
        decimals: 18,
        chainId: 8217,
        pegCurrency: 'KRW',
        tags: ['stable', 'krw'],
        isActive: true,
        depegThresholdBps: 50,
      },
      {
        address: '0x...', // KRT 주소
        symbol: 'KRT',
        name: 'Klaytn KRW',
        decimals: 18,
        chainId: 8217,
        pegCurrency: 'KRW',
        tags: ['stable', 'krw'],
        isActive: true,
        depegThresholdBps: 50,
      },
    ];

    krwStables.forEach(stable => {
      this.krwStables.set(stable.address.toLowerCase(), {
        ...stable,
        currentPrice: 1.0, // 기본값
        isDepegged: false,
        lastUpdateTime: Date.now(),
      });
    });
  }

  // ============ Core Functions ============

  /**
   * KRW 스테이블코인 간 최적화된 견적 조회
   */
  async getKRWQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<KRWQuote> {
    try {
      // 입력 검증
      const tokenInInfo = this.krwStables.get(tokenIn.toLowerCase());
      const tokenOutInfo = this.krwStables.get(tokenOut.toLowerCase());

      if (!tokenInInfo || !tokenOutInfo) {
        throw new Error('Unsupported KRW stablecoin');
      }

      // 디페그 체크
      const depegAlerts = await this.checkDepegStatus([tokenIn, tokenOut]);

      // 라우트 생성
      const routes = await this.generateKRWRoutes(tokenIn, tokenOut, amountIn);

      // TTV 계산 및 최적화
      const optimizedRoutes = await this.optimizeKRWRoutes(routes, tokenIn, tokenOut, amountIn);

      // 최적 라우트 선택
      const bestRoute = optimizedRoutes.reduce((best, current) => 
        current.ttvUsd < best.ttvUsd ? current : best
      );

      // KRW 최적화 분석
      const krwOptimization = await this.analyzeKRWOptimization(
        tokenIn,
        tokenOut,
        amountIn,
        optimizedRoutes
      );

      // 출력 금액 계산
      const amountOut = await this.calculateOutputAmount(
        tokenIn,
        tokenOut,
        amountIn,
        bestRoute
      );

      return {
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        routes: optimizedRoutes,
        bestRoute,
        krwOptimization,
        depegAlerts,
        expiresAt: Date.now() + 30000, // 30초
      };

    } catch (error) {
      console.error('KRW quote error:', error);
      throw new Error('Failed to get KRW quote');
    }
  }

  /**
   * KRW 스테이블코인과 USD 스테이블코인 간 견적
   */
  async getUSDToKRWQuote(
    usdToken: string,
    krwToken: string,
    amountIn: string
  ): Promise<KRWQuote> {
    try {
      // USD 스테이블코인 검증
      if (!this.isUSDStablecoin(usdToken)) {
        throw new Error('Invalid USD stablecoin');
      }

      // KRW 스테이블코인 검증
      const krwInfo = this.krwStables.get(krwToken.toLowerCase());
      if (!krwInfo) {
        throw new Error('Invalid KRW stablecoin');
      }

      // 디페그 체크
      const depegAlerts = await this.checkDepegStatus([krwToken]);

      // USD → KRW 라우트 생성
      const routes = await this.generateUSDToKRWRoutes(usdToken, krwToken, amountIn);

      // TTV 계산 및 최적화
      const optimizedRoutes = await this.optimizeKRWRoutes(routes, usdToken, krwToken, amountIn);

      // 최적 라우트 선택
      const bestRoute = optimizedRoutes.reduce((best, current) => 
        current.ttvUsd < best.ttvUsd ? current : best
      );

      // KRW 최적화 분석
      const krwOptimization = await this.analyzeKRWOptimization(
        usdToken,
        krwToken,
        amountIn,
        optimizedRoutes
      );

      // 출력 금액 계산
      const amountOut = await this.calculateOutputAmount(
        usdToken,
        krwToken,
        amountIn,
        bestRoute
      );

      return {
        tokenIn: usdToken,
        tokenOut: krwToken,
        amountIn,
        amountOut,
        routes: optimizedRoutes,
        bestRoute,
        krwOptimization,
        depegAlerts,
        expiresAt: Date.now() + 30000,
      };

    } catch (error) {
      console.error('USD to KRW quote error:', error);
      throw new Error('Failed to get USD to KRW quote');
    }
  }

  // ============ Route Generation ============

  private async generateKRWRoutes(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<KRWRoute[]> {
    const routes: KRWRoute[] = [];

    // 1. 직접 KRW → KRW 라우트
    const directRoute: KRWRoute = {
      type: 'direct',
      tokenIn,
      tokenOut,
      ttvUsd: 0, // TTV 엔진에서 계산
      savingsUsd: 0,
      savingsPercent: 0,
      isRecommended: false,
    };
    routes.push(directRoute);

    // 2. USD 허브 경유 라우트 (KRW → USDC → KRW)
    const usdHubRoute: KRWRoute = {
      type: 'usd_hub',
      tokenIn,
      tokenOut,
      intermediateToken: '0x6270B58BE569a7c0b8f47594F191631Ae5b2C86C', // USDC on Klaytn
      ttvUsd: 0, // TTV 엔진에서 계산
      savingsUsd: 0,
      savingsPercent: 0,
      isRecommended: false,
    };
    routes.push(usdHubRoute);

    return routes;
  }

  private async generateUSDToKRWRoutes(
    usdToken: string,
    krwToken: string,
    amountIn: string
  ): Promise<KRWRoute[]> {
    const routes: KRWRoute[] = [];

    // USD → KRW 직접 라우트
    const directRoute: KRWRoute = {
      type: 'direct',
      tokenIn: usdToken,
      tokenOut: krwToken,
      ttvUsd: 0,
      savingsUsd: 0,
      savingsPercent: 0,
      isRecommended: false,
    };
    routes.push(directRoute);

    return routes;
  }

  // ============ Route Optimization ============

  private async optimizeKRWRoutes(
    routes: KRWRoute[],
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<KRWRoute[]> {
    const optimizedRoutes: KRWRoute[] = [];

    for (const route of routes) {
      try {
        // TTV 계산
        const ttv = await this.calculateRouteTTV(route, tokenIn, tokenOut, amountIn);
        route.ttvUsd = ttv;

        optimizedRoutes.push(route);
      } catch (error) {
        console.error('Route optimization error:', error);
        // 실패한 라우트는 제외
      }
    }

    // TTV 기준으로 정렬
    optimizedRoutes.sort((a, b) => a.ttvUsd - b.ttvUsd);

    // 절감액 계산
    if (optimizedRoutes.length > 1) {
      const bestTTV = optimizedRoutes[0].ttvUsd;
      optimizedRoutes.forEach((route, index) => {
        if (index > 0) {
          route.savingsUsd = route.ttvUsd - bestTTV;
          route.savingsPercent = (route.savingsUsd / route.ttvUsd) * 100;
        }
      });
    }

    // 추천 라우트 설정
    if (optimizedRoutes.length > 0) {
      optimizedRoutes[0].isRecommended = true;
    }

    return optimizedRoutes;
  }

  private async calculateRouteTTV(
    route: KRWRoute,
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<number> {
    try {
      // 라우트 타입별 TTV 계산
      switch (route.type) {
        case 'direct':
          return await this.calculateDirectRouteTTV(tokenIn, tokenOut, amountIn);
        
        case 'usd_hub':
          return await this.calculateHubRouteTTV(
            tokenIn,
            tokenOut,
            amountIn,
            route.intermediateToken!
          );
        
        default:
          return 0;
      }
    } catch (error) {
      console.error('Route TTV calculation error:', error);
      return 0;
    }
  }

  private async calculateDirectRouteTTV(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<number> {
    try {
      // 직접 라우트는 일반적으로 가장 저렴
      // 가스비 + 서비스 수수료만 계산
      const gasCostUsd = 0.5; // Klaytn 가스비 (USD)
      const serviceFeeUsd = parseFloat(amountIn) * 0.0005; // 0.05%
      
      return gasCostUsd + serviceFeeUsd;
    } catch (error) {
      console.error('Direct route TTV calculation error:', error);
      return 0;
    }
  }

  private async calculateHubRouteTTV(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    intermediateToken: string
  ): Promise<number> {
    try {
      // 허브 경유 라우트는 두 번의 스왑 필요
      // 1. tokenIn → intermediateToken
      // 2. intermediateToken → tokenOut
      
      const firstSwapTTV = await this.calculateDirectRouteTTV(tokenIn, intermediateToken, amountIn);
      const secondSwapTTV = await this.calculateDirectRouteTTV(intermediateToken, tokenOut, amountIn);
      
      return firstSwapTTV + secondSwapTTV;
    } catch (error) {
      console.error('Hub route TTV calculation error:', error);
      return 0;
    }
  }

  // ============ KRW Optimization Analysis ============

  private async analyzeKRWOptimization(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    routes: KRWRoute[]
  ): Promise<{
    isDirectBetter: boolean;
    directSavingsUsd: number;
    directSavingsPercent: number;
    recommendation: string;
  }> {
    try {
      if (routes.length < 2) {
        return {
          isDirectBetter: true,
          directSavingsUsd: 0,
          directSavingsPercent: 0,
          recommendation: 'Direct route is the only option',
        };
      }

      const directRoute = routes.find(r => r.type === 'direct');
      const hubRoute = routes.find(r => r.type === 'usd_hub');

      if (!directRoute || !hubRoute) {
        return {
          isDirectBetter: true,
          directSavingsUsd: 0,
          directSavingsPercent: 0,
          recommendation: 'Unable to compare routes',
        };
      }

      const isDirectBetter = directRoute.ttvUsd < hubRoute.ttvUsd;
      const savingsUsd = Math.abs(directRoute.ttvUsd - hubRoute.ttvUsd);
      const savingsPercent = (savingsUsd / Math.max(directRoute.ttvUsd, hubRoute.ttvUsd)) * 100;

      let recommendation: string;
      if (isDirectBetter) {
        recommendation = `KRW 직접 스왑이 ${savingsUsd.toFixed(2)} USD (${savingsPercent.toFixed(1)}%) 더 저렴합니다.`;
      } else {
        recommendation = `USD 허브 경유가 ${savingsUsd.toFixed(2)} USD (${savingsPercent.toFixed(1)}%) 더 저렴합니다.`;
      }

      return {
        isDirectBetter,
        directSavingsUsd: isDirectBetter ? savingsUsd : 0,
        directSavingsPercent: isDirectBetter ? savingsPercent : 0,
        recommendation,
      };

    } catch (error) {
      console.error('KRW optimization analysis error:', error);
      return {
        isDirectBetter: true,
        directSavingsUsd: 0,
        directSavingsPercent: 0,
        recommendation: 'Analysis failed',
      };
    }
  }

  // ============ Depeg Detection ============

  async checkDepegStatus(tokens: string[]): Promise<any[]> {
    const alerts: any[] = [];

    for (const token of tokens) {
      try {
        const stableInfo = this.krwStables.get(token.toLowerCase());
        if (!stableInfo) continue;

        // 현재 가격 조회 (실제로는 오라클에서)
        const currentPrice = await this.getCurrentPrice(token);
        const targetPrice = this.getTargetPrice(stableInfo.pegCurrency);
        
        const deviationBps = this.calculateDeviationBps(currentPrice, targetPrice);
        
        if (deviationBps > stableInfo.depegThresholdBps) {
          const severity = this.calculateSeverity(deviationBps, stableInfo.depegThresholdBps);
          
          alerts.push({
            token,
            currentPrice,
            targetPrice,
            deviationBps,
            severity,
          });

          // 디페그 상태 업데이트
          stableInfo.isDepegged = true;
          stableInfo.currentPrice = currentPrice;
          stableInfo.lastUpdateTime = Date.now();
        } else {
          stableInfo.isDepegged = false;
          stableInfo.currentPrice = currentPrice;
          stableInfo.lastUpdateTime = Date.now();
        }

      } catch (error) {
        console.error('Depeg check error for token:', token, error);
      }
    }

    return alerts;
  }

  private async getCurrentPrice(token: string): Promise<number> {
    try {
      // 실제로는 KRW 오라클에서 가격 조회
      // 여기서는 예시로 1.0 반환
      return 1.0;
    } catch (error) {
      console.error('Price fetch error:', error);
      return 1.0;
    }
  }

  private getTargetPrice(pegCurrency: string): number {
    switch (pegCurrency) {
      case 'USD':
        return 1.0;
      case 'KRW':
        return 1.0 / this.usdKrwRate; // USD 기준으로 환산
      default:
        return 1.0;
    }
  }

  private calculateDeviationBps(currentPrice: number, targetPrice: number): number {
    if (currentPrice >= targetPrice) {
      return ((currentPrice - targetPrice) * 10000) / targetPrice;
    } else {
      return ((targetPrice - currentPrice) * 10000) / targetPrice;
    }
  }

  private calculateSeverity(deviationBps: number, thresholdBps: number): number {
    if (deviationBps <= thresholdBps * 2) return 1; // 경고
    if (deviationBps <= thresholdBps * 5) return 2; // 위험
    return 3; // 심각
  }

  // ============ Helper Functions ============

  private isUSDStablecoin(token: string): boolean {
    const usdStables = [
      '0xA0b86a33E6441b8c4C8C0E4b8c4C8C0E4b8c4C8C0', // USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    ];
    
    return usdStables.includes(token.toLowerCase());
  }

  private async calculateOutputAmount(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    route: KRWRoute
  ): Promise<string> {
    try {
      // 실제로는 라우터에서 출력 금액 계산
      // 여기서는 간단히 입력 금액과 동일하게 반환
      return amountIn;
    } catch (error) {
      console.error('Output amount calculation error:', error);
      return '0';
    }
  }

  // ============ Public API ============

  async getKRWStableInfo(token: string): Promise<KRWStableInfo | null> {
    return this.krwStables.get(token.toLowerCase()) || null;
  }

  async getAllKRWStables(): Promise<KRWStableInfo[]> {
    return Array.from(this.krwStables.values());
  }

  async updateUSDKrwRate(): Promise<void> {
    try {
      // 실제로는 외부 API에서 USD/KRW 환율 조회
      // 여기서는 예시로 고정값 사용
      this.usdKrwRate = 1300;
    } catch (error) {
      console.error('USD/KRW rate update error:', error);
    }
  }
}

// ============ Singleton Instance ============
export const krwStableService = new KRWStableService();