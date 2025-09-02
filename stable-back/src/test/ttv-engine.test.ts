import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TTVEngine } from '../services/ttv-engine';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('TTVEngine', () => {
  let ttvEngine: TTVEngine;

  beforeEach(() => {
    ttvEngine = new TTVEngine();
    vi.clearAllMocks();
  });

  describe('calculateTTV', () => {
    it('should calculate TTV correctly for a basic swap', async () => {
      const mockRoute = {
        provider: 'uniswap-v3',
        router: '0x123...',
        outputAmount: '1000',
        gasEstimate: 200000,
        callData: '0x',
        to: '0x456...',
        value: '0',
      };

      // Mock token price
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0': {
            usd: 1.0
          }
        }
      });

      const breakdown = await ttvEngine.calculateTTV(
        1, // Ethereum
        '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0', // USDC
        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
        '1000', // 1000 USDC
        mockRoute
      );

      expect(breakdown).toBeDefined();
      expect(breakdown.totalCostUsd).toBeGreaterThan(0);
      expect(breakdown.gasCostUsd).toBeGreaterThan(0);
      expect(breakdown.serviceFeeUsd).toBeGreaterThan(0);
    });

    it('should handle different providers correctly', async () => {
      const providers = ['0x', '1inch', 'uniswap-v2', 'uniswap-v3', 'sushiswap'];
      
      for (const provider of providers) {
        const mockRoute = {
          provider,
          router: '0x123...',
          outputAmount: '1000',
          gasEstimate: 200000,
          callData: '0x',
          to: '0x456...',
          value: '0',
        };

        mockedAxios.get.mockResolvedValueOnce({
          data: {
            '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0': {
              usd: 1.0
            }
          }
        });

        const breakdown = await ttvEngine.calculateTTV(
          1,
          '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0',
          '0xdac17f958d2ee523a2206206994597c13d831ec7',
          '1000',
          mockRoute
        );

        expect(breakdown).toBeDefined();
        expect(breakdown.protocolFeeUsd).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle API errors gracefully', async () => {
      const mockRoute = {
        provider: 'uniswap-v3',
        router: '0x123...',
        outputAmount: '1000',
        gasEstimate: 200000,
        callData: '0x',
        to: '0x456...',
        value: '0',
      };

      // Mock API error
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(
        ttvEngine.calculateTTV(
          1,
          '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0',
          '0xdac17f958d2ee523a2206206994597c13d831ec7',
          '1000',
          mockRoute
        )
      ).rejects.toThrow('Failed to calculate TTV');
    });
  });

  describe('optimizeRoutes', () => {
    it('should select the best route based on TTV', async () => {
      const mockRoutes = [
        {
          provider: 'uniswap-v3',
          router: '0x123...',
          outputAmount: '1000',
          gasEstimate: 200000,
          callData: '0x',
          to: '0x456...',
          value: '0',
        },
        {
          provider: '1inch',
          router: '0x789...',
          outputAmount: '1000',
          gasEstimate: 150000,
          callData: '0x',
          to: '0xabc...',
          value: '0',
        },
      ];

      // Mock token prices
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0': {
              usd: 1.0
            }
          }
        })
        .mockResolvedValueOnce({
          data: {
            '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0': {
              usd: 1.0
            }
          }
        });

      const result = await ttvEngine.optimizeRoutes(
        1,
        '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0',
        '0xdac17f958d2ee523a2206206994597c13d831ec7',
        '1000',
        mockRoutes
      );

      expect(result).toBeDefined();
      expect(result.bestRoute).toBeDefined();
      expect(result.alternatives).toBeDefined();
      expect(result.bestRoute.breakdown.totalCostUsd).toBeLessThanOrEqual(
        result.alternatives[0]?.breakdown.totalCostUsd || Infinity
      );
    });

    it('should handle empty routes array', async () => {
      await expect(
        ttvEngine.optimizeRoutes(
          1,
          '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0',
          '0xdac17f958d2ee523a2206206994597c13d831ec7',
          '1000',
          []
        )
      ).rejects.toThrow('No routes provided');
    });
  });

  describe('compareKRWRoutes', () => {
    it('should compare KRW direct vs USD hub routes', async () => {
      const mockUsdRoute = {
        provider: 'uniswap-v3',
        router: '0x123...',
        outputAmount: '1000',
        gasEstimate: 200000,
        callData: '0x',
        to: '0x456...',
        value: '0',
        isKRWDirect: false,
        breakdown: {
          totalCostUsd: 5.0,
          gasCostUsd: 2.0,
          protocolFeeUsd: 1.0,
          aggregatorFeeUsd: 0,
          lpFeeUsd: 1.0,
          slippageUsd: 0.5,
          serviceFeeUsd: 0.5,
          netAmountOut: 995.0,
        },
      };

      const result = await ttvEngine.compareKRWRoutes(
        '0x6270B58BE569a7c0b8f47594F191631Ae5b2C86C', // KRWx
        '0xceE8FAF64bE97aF5a7016412E8a34b4932325Ee7', // KRT
        '1000',
        mockUsdRoute
      );

      expect(result).toBeDefined();
      expect(result.isDirectBetter).toBeDefined();
      expect(result.directSavingsUsd).toBeGreaterThanOrEqual(0);
      expect(result.directSavingsPercent).toBeGreaterThanOrEqual(0);
    });
  });

  describe('price conversion', () => {
    it('should convert token amounts to USD correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0': {
            usd: 1.0
          }
        }
      });

      const usdAmount = await ttvEngine['convertToUsd']('1000', '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0');
      expect(usdAmount).toBe(1000);
    });

    it('should handle zero price gracefully', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0': {
            usd: 0
          }
        }
      });

      const usdAmount = await ttvEngine['convertToUsd']('1000', '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0');
      expect(usdAmount).toBe(0);
    });
  });

  describe('cache management', () => {
    it('should update token prices correctly', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0': {
            usd: 1.0
          },
          '0xdac17f958d2ee523a2206206994597c13d831ec7': {
            usd: 1.0
          }
        }
      });

      await ttvEngine.updateTokenPrices();
      
      // Verify that prices are cached
      const price = await ttvEngine['getTokenPriceUsd']('0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0');
      expect(price).toBe(1.0);
    });

    it('should update gas prices correctly', async () => {
      // Mock viem client
      const mockClient = {
        getGasPrice: vi.fn().mockResolvedValue(BigInt('20000000000')) // 20 gwei
      };
      
      ttvEngine['clients'].set(1, mockClient);

      await ttvEngine.updateGasPrices();
      
      const gasPrice = ttvEngine['gasPrices'].get(1);
      expect(gasPrice).toBeDefined();
      expect(gasPrice?.gasPrice).toBe(BigInt('20000000000'));
    });
  });
});