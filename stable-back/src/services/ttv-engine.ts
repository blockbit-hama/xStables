import { z } from 'zod';
import axios from 'axios';
import { createPublicClient, http, formatUnits, parseUnits } from 'viem';
import { mainnet, arbitrum, optimism, polygon, klaytn } from 'viem/chains';

// ============ Types ============
export const CostBreakdownSchema = z.object({
  gasCostUsd: z.number(),
  protocolFeeUsd: z.number(),
  aggregatorFeeUsd: z.number(),
  lpFeeUsd: z.number(),
  slippageUsd: z.number(),
  serviceFeeUsd: z.number(),
  totalCostUsd: z.number(),
  netAmountOut: z.number(),
  savingsUsd: z.number().optional(),
  savingsPercent: z.number().optional(),
});

export const RouteInfoSchema = z.object({
  provider: z.string(),
  router: z.string(),
  outputAmount: z.string(),
  gasEstimate: z.number(),
  callData: z.string(),
  to: z.string(),
  value: z.string(),
  allowanceTarget: z.string().optional(),
  isKRWDirect: z.boolean(),
  breakdown: CostBreakdownSchema,
});

export const QuoteResponseSchema = z.object({
  bestRoute: RouteInfoSchema,
  alternatives: z.array(RouteInfoSchema),
  breakdown: CostBreakdownSchema,
  expiresAt: z.number(),
  krwOptimization: z.object({
    isDirectBetter: z.boolean(),
    directSavingsUsd: z.number(),
    directSavingsPercent: z.number(),
  }).optional(),
});

export type CostBreakdown = z.infer<typeof CostBreakdownSchema>;
export type RouteInfo = z.infer<typeof RouteInfoSchema>;
export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;

// ============ TTV Engine Class ============
export class TTVEngine {
  private clients: Map<number, any> = new Map();
  private tokenPrices: Map<string, { usd: number; krw: number; timestamp: number }> = new Map();
  private gasPrices: Map<number, { gasPrice: bigint; timestamp: number }> = new Map();

  constructor() {
    this.initializeClients();
  }

  // ============ Client Initialization ============
  private initializeClients() {
    const chains = [
      { id: 1, chain: mainnet, rpc: process.env.ETHEREUM_RPC },
      { id: 42161, chain: arbitrum, rpc: process.env.ARBITRUM_RPC },
      { id: 10, chain: optimism, rpc: process.env.OPTIMISM_RPC },
      { id: 137, chain: polygon, rpc: process.env.POLYGON_RPC },
      { id: 8217, chain: klaytn, rpc: process.env.KLAYTN_RPC },
    ];

    chains.forEach(({ id, chain, rpc }) => {
      if (rpc) {
        this.clients.set(id, createPublicClient({
          chain,
          transport: http(rpc),
        }));
      }
    });
  }

  // ============ Core TTV Calculation ============
  async calculateTTV(
    chainId: number,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    route: any
  ): Promise<CostBreakdown> {
    const breakdown: CostBreakdown = {
      gasCostUsd: 0,
      protocolFeeUsd: 0,
      aggregatorFeeUsd: 0,
      lpFeeUsd: 0,
      slippageUsd: 0,
      serviceFeeUsd: 0,
      totalCostUsd: 0,
      netAmountOut: 0,
    };

    try {
      // 1. 가스비 계산
      breakdown.gasCostUsd = await this.calculateGasCostUsd(chainId, route.gasEstimate);

      // 2. 프로토콜 수수료 계산
      breakdown.protocolFeeUsd = await this.calculateProtocolFeeUsd(
        tokenIn,
        amountIn,
        route.provider
      );

      // 3. 애그리게이터 수수료 계산
      breakdown.aggregatorFeeUsd = await this.calculateAggregatorFeeUsd(
        tokenIn,
        amountIn,
        route.provider
      );

      // 4. LP 수수료 계산
      breakdown.lpFeeUsd = await this.calculateLPFeeUsd(
        tokenIn,
        amountIn,
        route.provider
      );

      // 5. 슬리피지 비용 계산
      breakdown.slippageUsd = await this.calculateSlippageUsd(
        tokenIn,
        tokenOut,
        amountIn,
        route.outputAmount
      );

      // 6. 서비스 수수료 계산
      breakdown.serviceFeeUsd = await this.calculateServiceFeeUsd(tokenIn, amountIn);

      // 7. 총 비용 계산
      breakdown.totalCostUsd = 
        breakdown.gasCostUsd +
        breakdown.protocolFeeUsd +
        breakdown.aggregatorFeeUsd +
        breakdown.lpFeeUsd +
        breakdown.slippageUsd +
        breakdown.serviceFeeUsd;

      // 8. 순 출력 금액 계산
      const amountInUsd = await this.convertToUsd(amountIn, tokenIn);
      const outputAmountUsd = await this.convertToUsd(route.outputAmount, tokenOut);
      breakdown.netAmountOut = outputAmountUsd - breakdown.totalCostUsd;

    } catch (error) {
      console.error('TTV calculation error:', error);
      throw new Error('Failed to calculate TTV');
    }

    return breakdown;
  }

  // ============ Individual Cost Calculations ============

  private async calculateGasCostUsd(chainId: number, gasEstimate: number): Promise<number> {
    try {
      const client = this.clients.get(chainId);
      if (!client) throw new Error(`No client for chain ${chainId}`);

      // 현재 가스 가격 조회
      const gasPrice = await client.getGasPrice();
      const gasPriceGwei = Number(formatUnits(gasPrice, 'gwei'));

      // ETH/USD 가격 조회
      const ethPriceUsd = await this.getTokenPriceUsd('0x0000000000000000000000000000000000000000');
      
      // 가스비 USD 환산
      const gasCostEth = (gasEstimate * gasPriceGwei) / 1e9;
      const gasCostUsd = gasCostEth * ethPriceUsd;

      // 10% 버퍼 적용
      return gasCostUsd * 1.1;

    } catch (error) {
      console.error('Gas cost calculation error:', error);
      return 0;
    }
  }

  private async calculateProtocolFeeUsd(
    tokenIn: string,
    amountIn: string,
    provider: string
  ): Promise<number> {
    try {
      // 프로바이더별 수수료 구조
      const feeRates: Record<string, number> = {
        '0x': 0, // 0x Protocol은 수수료 없음
        '1inch': 0, // 1inch는 수수료 없음
        'uniswap-v2': 30, // 0.3%
        'uniswap-v3': 30, // 0.3%
        'sushiswap': 30, // 0.3%
        'curve': 4, // 0.04%
      };

      const feeBps = feeRates[provider] || 0;
      if (feeBps === 0) return 0;

      const amountInUsd = await this.convertToUsd(amountIn, tokenIn);
      return (amountInUsd * feeBps) / 10000;

    } catch (error) {
      console.error('Protocol fee calculation error:', error);
      return 0;
    }
  }

  private async calculateAggregatorFeeUsd(
    tokenIn: string,
    amountIn: string,
    provider: string
  ): Promise<number> {
    try {
      // 애그리게이터별 수수료 (일반적으로 없음)
      const feeRates: Record<string, number> = {
        '0x': 0,
        '1inch': 0,
        'paraswap': 0,
      };

      const feeBps = feeRates[provider] || 0;
      if (feeBps === 0) return 0;

      const amountInUsd = await this.convertToUsd(amountIn, tokenIn);
      return (amountInUsd * feeBps) / 10000;

    } catch (error) {
      console.error('Aggregator fee calculation error:', error);
      return 0;
    }
  }

  private async calculateLPFeeUsd(
    tokenIn: string,
    amountIn: string,
    provider: string
  ): Promise<number> {
    try {
      // LP 수수료는 프로토콜 수수료와 동일 (Uniswap, SushiSwap 등)
      return await this.calculateProtocolFeeUsd(tokenIn, amountIn, provider);

    } catch (error) {
      console.error('LP fee calculation error:', error);
      return 0;
    }
  }

  private async calculateSlippageUsd(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    outputAmount: string
  ): Promise<number> {
    try {
      // 슬리피지는 실제 출력과 예상 출력의 차이
      // 여기서는 간단히 0.5% 슬리피지 가정
      const slippageBps = 50; // 0.5%
      const outputAmountUsd = await this.convertToUsd(outputAmount, tokenOut);
      return (outputAmountUsd * slippageBps) / 10000;

    } catch (error) {
      console.error('Slippage calculation error:', error);
      return 0;
    }
  }

  private async calculateServiceFeeUsd(tokenIn: string, amountIn: string): Promise<number> {
    try {
      const serviceFeeBps = 5; // 0.05%
      const amountInUsd = await this.convertToUsd(amountIn, tokenIn);
      return (amountInUsd * serviceFeeBps) / 10000;

    } catch (error) {
      console.error('Service fee calculation error:', error);
      return 0;
    }
  }

  // ============ Price Conversion ============

  private async convertToUsd(amount: string, token: string): Promise<number> {
    try {
      const tokenPrice = await this.getTokenPriceUsd(token);
      const amountNumber = parseFloat(amount);
      return amountNumber * tokenPrice;

    } catch (error) {
      console.error('USD conversion error:', error);
      return 0;
    }
  }

  private async getTokenPriceUsd(token: string): Promise<number> {
    try {
      // 캐시된 가격 확인
      const cached = this.tokenPrices.get(token);
      if (cached && Date.now() - cached.timestamp < 60000) { // 1분 캐시
        return cached.usd;
      }

      // CoinGecko API로 가격 조회
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${token}&vs_currencies=usd`,
        { timeout: 5000 }
      );

      const price = response.data[token.toLowerCase()]?.usd || 0;
      
      // 캐시 업데이트
      this.tokenPrices.set(token, {
        usd: price,
        krw: price * 1300, // USD/KRW 환율 (실제로는 실시간 조회)
        timestamp: Date.now(),
      });

      return price;

    } catch (error) {
      console.error('Token price fetch error:', error);
      return 0;
    }
  }

  // ============ KRW Optimization ============

  async compareKRWRoutes(
    krwTokenIn: string,
    krwTokenOut: string,
    amountIn: string,
    usdRoute: RouteInfo
  ): Promise<{
    isDirectBetter: boolean;
    directSavingsUsd: number;
    directSavingsPercent: number;
  }> {
    try {
      // KRW 직접 스왑 TTV 계산 (가상)
      const directTTV = await this.calculateDirectKRWTTV(krwTokenIn, krwTokenOut, amountIn);
      
      // USD 경유 스왑 TTV
      const usdTTV = usdRoute.breakdown.totalCostUsd;

      const isDirectBetter = directTTV < usdTTV;
      const savingsUsd = Math.abs(directTTV - usdTTV);
      const savingsPercent = (savingsUsd / Math.max(directTTV, usdTTV)) * 100;

      return {
        isDirectBetter,
        directSavingsUsd: isDirectBetter ? savingsUsd : 0,
        directSavingsPercent: isDirectBetter ? savingsPercent : 0,
      };

    } catch (error) {
      console.error('KRW route comparison error:', error);
      return {
        isDirectBetter: false,
        directSavingsUsd: 0,
        directSavingsPercent: 0,
      };
    }
  }

  private async calculateDirectKRWTTV(
    krwTokenIn: string,
    krwTokenOut: string,
    amountIn: string
  ): Promise<number> {
    try {
      // KRW 직접 스왑은 일반적으로 더 저렴
      // 가스비만 계산 (수수료 최소화)
      const gasCostUsd = await this.calculateGasCostUsd(8217, 150000); // Klaytn 가스 추정
      const serviceFeeUsd = await this.calculateServiceFeeUsd(krwTokenIn, amountIn);
      
      return gasCostUsd + serviceFeeUsd;

    } catch (error) {
      console.error('Direct KRW TTV calculation error:', error);
      return 0;
    }
  }

  // ============ Route Optimization ============

  async optimizeRoutes(
    chainId: number,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    routes: any[]
  ): Promise<QuoteResponse> {
    try {
      const routeInfos: RouteInfo[] = [];

      // 각 라우트의 TTV 계산
      for (const route of routes) {
        const breakdown = await this.calculateTTV(chainId, tokenIn, tokenOut, amountIn, route);
        
        const routeInfo: RouteInfo = {
          provider: route.provider,
          router: route.router || route.to,
          outputAmount: route.outputAmount,
          gasEstimate: route.gasEstimate || 200000,
          callData: route.callData,
          to: route.to,
          value: route.value || '0',
          allowanceTarget: route.allowanceTarget,
          isKRWDirect: this.isKRWDirectRoute(tokenIn, tokenOut),
          breakdown,
        };

        routeInfos.push(routeInfo);
      }

      // TTV 기준으로 정렬
      routeInfos.sort((a, b) => a.breakdown.totalCostUsd - b.breakdown.totalCostUsd);

      const bestRoute = routeInfos[0];
      const alternatives = routeInfos.slice(1);

      // 절감액 계산
      if (alternatives.length > 0) {
        const bestTTV = bestRoute.breakdown.totalCostUsd;
        alternatives.forEach(alt => {
          alt.breakdown.savingsUsd = alt.breakdown.totalCostUsd - bestTTV;
          alt.breakdown.savingsPercent = (alt.breakdown.savingsUsd / alt.breakdown.totalCostUsd) * 100;
        });
      }

      // KRW 최적화 체크
      let krwOptimization;
      if (this.isKRWStablecoin(tokenIn) && this.isKRWStablecoin(tokenOut)) {
        krwOptimization = await this.compareKRWRoutes(tokenIn, tokenOut, amountIn, bestRoute);
      }

      return {
        bestRoute,
        alternatives,
        breakdown: bestRoute.breakdown,
        expiresAt: Date.now() + 30000, // 30초
        krwOptimization,
      };

    } catch (error) {
      console.error('Route optimization error:', error);
      throw new Error('Failed to optimize routes');
    }
  }

  // ============ Helper Functions ============

  private isKRWDirectRoute(tokenIn: string, tokenOut: string): boolean {
    return this.isKRWStablecoin(tokenIn) && this.isKRWStablecoin(tokenOut);
  }

  private isKRWStablecoin(token: string): boolean {
    // KRW 스테이블코인 주소 체크 (실제 구현에서는 데이터베이스에서 조회)
    const krwStables = [
      '0x6270B58BE569a7c0b8f47594F191631Ae5b2C86C', // USDC on Klaytn
      '0xceE8FAF64bE97aF5a7016412E8a34b4932325Ee7', // USDT on Klaytn
      // KRWx, KRT 등 추가
    ];
    
    return krwStables.includes(token.toLowerCase());
  }

  // ============ Cache Management ============

  async updateTokenPrices(): Promise<void> {
    try {
      const tokens = [
        '0xA0b86a33E6441b8c4C8C0E4b8c4C8C0E4b8c4C8C0', // USDC
        '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
        '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
        '0x0000000000000000000000000000000000000000', // ETH
      ];

      for (const token of tokens) {
        await this.getTokenPriceUsd(token);
      }

    } catch (error) {
      console.error('Token price update error:', error);
    }
  }

  async updateGasPrices(): Promise<void> {
    try {
      const chains = [1, 42161, 10, 137, 8217]; // Ethereum, Arbitrum, Optimism, Polygon, Klaytn

      for (const chainId of chains) {
        const client = this.clients.get(chainId);
        if (client) {
          const gasPrice = await client.getGasPrice();
          this.gasPrices.set(chainId, {
            gasPrice,
            timestamp: Date.now(),
          });
        }
      }

    } catch (error) {
      console.error('Gas price update error:', error);
    }
  }
}

// ============ Singleton Instance ============
export const ttvEngine = new TTVEngine();