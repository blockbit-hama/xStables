import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../server';
import { FastifyInstance } from 'fastify';

describe('Integration Tests', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/health'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
    });
  });

  describe('Monetization API', () => {
    it('should calculate service fee', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/monetization/calculate-fee',
        payload: {
          amountInUsd: 1000,
          userAddress: '0x1234567890123456789012345678901234567890',
          useSavingsBasedFee: false
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.serviceFeeUsd).toBeGreaterThan(0);
      expect(data.data.effectiveFeeBps).toBe(5);
    });

    it('should calculate savings-based fee', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/monetization/calculate-fee',
        payload: {
          amountInUsd: 1000,
          userAddress: '0x1234567890123456789012345678901234567890',
          savingsUsd: 50,
          useSavingsBasedFee: true
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.serviceFeeUsd).toBeGreaterThan(0);
      expect(data.data.savingsSharePercent).toBe(30);
    });

    it('should register partner', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/monetization/partners',
        payload: {
          partnerId: 'test-partner',
          partnerName: 'Test Partner',
          sharePercent: 30
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.partnerId).toBe('test-partner');
      expect(data.data.partnerName).toBe('Test Partner');
      expect(data.data.sharePercent).toBe(30);
    });

    it('should get partners list', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/monetization/partners'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should get premium features', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/monetization/premium-features'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });

    it('should calculate premium feature price', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/monetization/premium-features/calculate-price',
        payload: {
          featureId: 'mev_protection',
          usageCount: 5
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.totalPriceUsd).toBe(2.5); // $0.5 * 5
      expect(data.data.feature.id).toBe('mev_protection');
    });

    it('should get fee structure', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/monetization/fee-structure'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.serviceFeeBps).toBe(5);
      expect(data.data.minFeeUsd).toBe(0.01);
      expect(data.data.maxFeeUsd).toBe(10);
    });

    it('should generate revenue analytics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/monetization/analytics?period=30d'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.period).toBe('30d');
      expect(typeof data.data.totalVolumeUsd).toBe('number');
      expect(typeof data.data.totalRevenueUsd).toBe('number');
    });
  });

  describe('Risk Management API', () => {
    it('should assess risk', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/risk/assess',
        payload: {
          tokenIn: '0x6270B58BE569a7c0b8f47594F191631Ae5b2C86C',
          tokenOut: '0xceE8FAF64bE97aF5a7016412E8a34b4932325Ee7',
          amountIn: '1000',
          userAddress: '0x1234567890123456789012345678901234567890'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.riskScore).toBeGreaterThanOrEqual(0);
      expect(data.data.riskLevel).toMatch(/^(low|medium|high)$/);
      expect(Array.isArray(data.data.warnings)).toBe(true);
      expect(Array.isArray(data.data.recommendations)).toBe(true);
    });

    it('should check depeg status', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/risk/check-depeg',
        payload: {
          tokens: [
            '0x6270B58BE569a7c0b8f47594F191631Ae5b2C86C',
            '0xceE8FAF64bE97aF5a7016412E8a34b4932325Ee7'
          ]
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should get whitelist', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/risk/whitelist'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('Partner API', () => {
    it('should get white label config', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/partner/white-label/test-partner'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.partnerId).toBe('test-partner');
    });

    it('should update white label config', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/partner/white-label/test-partner',
        payload: {
          partnerId: 'test-partner',
          brandName: 'Updated Brand',
          primaryColor: '#FF0000',
          features: ['basic_swap', 'krw_optimization']
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.brandName).toBe('Updated Brand');
      expect(data.data.primaryColor).toBe('#FF0000');
    });

    it('should get partner analytics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/partner/analytics/test-partner?period=30d'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.partnerId).toBe('test-partner');
      expect(data.data.period).toBe('30d');
    });

    it('should get SDK documentation', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/partner/sdk'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.version).toBeDefined();
      expect(data.data.installation).toBeDefined();
      expect(Array.isArray(data.data.examples)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid request body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/monetization/calculate-fee',
        payload: {
          // Missing required fields
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle non-existent partner', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/partner/analytics/non-existent-partner'
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Partner not found');
    });

    it('should handle invalid premium feature', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/monetization/premium-features/calculate-price',
        payload: {
          featureId: 'non-existent-feature',
          usageCount: 1
        }
      });

      expect(response.statusCode).toBe(500);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
    });
  });

  describe('CORS and Security', () => {
    it('should include CORS headers', async () => {
      const response = await server.inject({
        method: 'OPTIONS',
        url: '/api/health'
      });

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should include security headers', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/health'
      });

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
    });
  });
});