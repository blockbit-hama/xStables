import { describe, it, expect, beforeEach } from 'vitest';
import { MonetizationService } from '../services/monetization-service';

describe('MonetizationService', () => {
  let monetizationService: MonetizationService;

  beforeEach(() => {
    monetizationService = new MonetizationService();
  });

  describe('calculateServiceFee', () => {
    it('should calculate basic service fee correctly', async () => {
      const result = await monetizationService.calculateServiceFee(
        1000, // $1000
        '0x123...', // user address
        undefined // no partner
      );

      expect(result.serviceFeeUsd).toBe(0.05); // 0.05% of $1000
      expect(result.partnerRevenueUsd).toBe(0);
      expect(result.platformRevenueUsd).toBe(0.05);
      expect(result.effectiveFeeBps).toBe(5); // 0.05%
    });

    it('should apply minimum fee correctly', async () => {
      const result = await monetizationService.calculateServiceFee(
        10, // $10
        '0x123...',
        undefined
      );

      expect(result.serviceFeeUsd).toBe(0.01); // Minimum $0.01
      expect(result.effectiveFeeBps).toBe(5);
    });

    it('should apply maximum fee correctly', async () => {
      const result = await monetizationService.calculateServiceFee(
        1000000, // $1M
        '0x123...',
        undefined
      );

      expect(result.serviceFeeUsd).toBe(10); // Maximum $10
      expect(result.effectiveFeeBps).toBe(5);
    });

    it('should calculate partner revenue correctly', async () => {
      // Register a partner first
      await monetizationService.registerPartner('partner1', 'Test Partner', 30);

      const result = await monetizationService.calculateServiceFee(
        1000, // $1000
        '0x123...',
        'partner1'
      );

      expect(result.serviceFeeUsd).toBe(0.05);
      expect(result.partnerRevenueUsd).toBe(0.015); // 30% of $0.05
      expect(result.platformRevenueUsd).toBe(0.035); // 70% of $0.05
    });
  });

  describe('calculateSavingsBasedFee', () => {
    it('should calculate savings-based fee correctly', async () => {
      const result = await monetizationService.calculateSavingsBasedFee(
        1000, // $1000 amount
        50, // $50 savings
        '0x123...',
        undefined
      );

      expect(result.serviceFeeUsd).toBe(15); // 30% of $50 savings
      expect(result.savingsSharePercent).toBe(30);
    });

    it('should apply minimum fee to savings-based calculation', async () => {
      const result = await monetizationService.calculateSavingsBasedFee(
        1000,
        1, // $1 savings
        '0x123...',
        undefined
      );

      expect(result.serviceFeeUsd).toBe(0.01); // Minimum $0.01
    });

    it('should apply maximum fee to savings-based calculation', async () => {
      const result = await monetizationService.calculateSavingsBasedFee(
        1000,
        1000, // $1000 savings
        '0x123...',
        undefined
      );

      expect(result.serviceFeeUsd).toBe(10); // Maximum $10
    });

    it('should calculate partner revenue for savings-based fee', async () => {
      await monetizationService.registerPartner('partner1', 'Test Partner', 30);

      const result = await monetizationService.calculateSavingsBasedFee(
        1000,
        50,
        '0x123...',
        'partner1'
      );

      expect(result.serviceFeeUsd).toBe(15);
      expect(result.partnerRevenueUsd).toBe(4.5); // 30% of $15
      expect(result.platformRevenueUsd).toBe(10.5); // 70% of $15
    });
  });

  describe('partner management', () => {
    it('should register partner correctly', async () => {
      const partner = await monetizationService.registerPartner(
        'partner1',
        'Test Partner',
        30
      );

      expect(partner.partnerId).toBe('partner1');
      expect(partner.partnerName).toBe('Test Partner');
      expect(partner.sharePercent).toBe(30);
      expect(partner.isActive).toBe(true);
      expect(partner.totalVolumeUsd).toBe(0);
      expect(partner.totalRevenueUsd).toBe(0);
    });

    it('should update partner revenue correctly', async () => {
      await monetizationService.registerPartner('partner1', 'Test Partner', 30);

      await monetizationService.updatePartnerRevenue('partner1', 1000, 5);

      const partner = await monetizationService.getPartner('partner1');
      expect(partner?.totalVolumeUsd).toBe(1000);
      expect(partner?.totalRevenueUsd).toBe(5);
      expect(partner?.transactionCount).toBe(1);
    });

    it('should return null for non-existent partner', async () => {
      const partner = await monetizationService.getPartner('non-existent');
      expect(partner).toBeNull();
    });

    it('should return all partners', async () => {
      await monetizationService.registerPartner('partner1', 'Partner 1', 30);
      await monetizationService.registerPartner('partner2', 'Partner 2', 25);

      const partners = await monetizationService.getPartners();
      expect(partners).toHaveLength(2);
      expect(partners[0].partnerId).toBe('partner1');
      expect(partners[1].partnerId).toBe('partner2');
    });
  });

  describe('transaction recording', () => {
    it('should record transaction correctly', async () => {
      const transaction = await monetizationService.recordTransaction(
        '0x123...',
        undefined, // no partner
        '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0', // USDC
        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
        '1000',
        '1000',
        0.05, // service fee
        0, // partner revenue
        0.05, // platform revenue
        1000, // TTV
        10, // savings
        1, // Ethereum
        '0xabc...' // tx hash
      );

      expect(transaction.id).toBeDefined();
      expect(transaction.userAddress).toBe('0x123...');
      expect(transaction.serviceFeeUsd).toBe(0.05);
      expect(transaction.ttvUsd).toBe(1000);
      expect(transaction.savingsUsd).toBe(10);
    });

    it('should update partner revenue when recording transaction', async () => {
      await monetizationService.registerPartner('partner1', 'Test Partner', 30);

      await monetizationService.recordTransaction(
        '0x123...',
        'partner1',
        '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0',
        '0xdac17f958d2ee523a2206206994597c13d831ec7',
        '1000',
        '1000',
        0.05,
        0.015, // partner revenue
        0.035, // platform revenue
        1000,
        10,
        1,
        '0xabc...'
      );

      const partner = await monetizationService.getPartner('partner1');
      expect(partner?.totalVolumeUsd).toBe(1000);
      expect(partner?.totalRevenueUsd).toBe(0.015);
      expect(partner?.transactionCount).toBe(1);
    });
  });

  describe('premium features', () => {
    it('should calculate premium feature price correctly', async () => {
      const result = await monetizationService.calculatePremiumFeaturePrice(
        'mev_protection',
        5 // 5 transactions
      );

      expect(result.totalPriceUsd).toBe(2.5); // $0.5 * 5
      expect(result.pricePerUnit).toBe(0.5);
      expect(result.feature.id).toBe('mev_protection');
    });

    it('should calculate monthly subscription price', async () => {
      const result = await monetizationService.calculatePremiumFeaturePrice(
        'priority_routing',
        1
      );

      expect(result.totalPriceUsd).toBe(9.99);
      expect(result.pricePerUnit).toBe(9.99);
      expect(result.feature.priceType).toBe('monthly');
    });

    it('should throw error for inactive feature', async () => {
      // Deactivate feature
      const features = await monetizationService.getPremiumFeatures();
      const mevFeature = features.find(f => f.id === 'mev_protection');
      if (mevFeature) {
        mevFeature.isActive = false;
      }

      await expect(
        monetizationService.calculatePremiumFeaturePrice('mev_protection', 1)
      ).rejects.toThrow('Premium feature not available');
    });

    it('should return all premium features', async () => {
      const features = await monetizationService.getPremiumFeatures();
      expect(features).toHaveLength(4);
      expect(features.every(f => f.isActive)).toBe(true);
    });
  });

  describe('white label pricing', () => {
    it('should calculate white label pricing for small volume', async () => {
      const result = await monetizationService.calculateWhiteLabelPrice(
        'partner1',
        50000 // $50K monthly volume
      );

      expect(result.monthlyFeeUsd).toBe(400);
      expect(result.revenueSharePercent).toBe(30);
      expect(result.totalCostUsd).toBeGreaterThan(400);
    });

    it('should calculate white label pricing for large volume', async () => {
      const result = await monetizationService.calculateWhiteLabelPrice(
        'partner1',
        1000000 // $1M monthly volume
      );

      expect(result.monthlyFeeUsd).toBe(200);
      expect(result.revenueSharePercent).toBe(30);
      expect(result.totalCostUsd).toBeGreaterThan(200);
    });
  });

  describe('revenue analytics', () => {
    beforeEach(async () => {
      // Record some test transactions
      await monetizationService.recordTransaction(
        '0x123...',
        undefined,
        '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0',
        '0xdac17f958d2ee523a2206206994597c13d831ec7',
        '1000',
        '1000',
        0.05,
        0,
        0.05,
        1000,
        10,
        1,
        '0xabc1...'
      );

      await monetizationService.recordTransaction(
        '0x456...',
        undefined,
        '0xa0b86a33e6441b8c4c8c0e4b8c4c8c0e4b8c4c8c0',
        '0xdac17f958d2ee523a2206206994597c13d831ec7',
        '2000',
        '2000',
        0.1,
        0,
        0.1,
        2000,
        20,
        1,
        '0xabc2...'
      );
    });

    it('should generate revenue analytics correctly', async () => {
      const analytics = await monetizationService.generateRevenueAnalytics('30d');

      expect(analytics.period).toBe('30d');
      expect(analytics.totalVolumeUsd).toBe(3000);
      expect(analytics.totalRevenueUsd).toBe(0.15);
      expect(analytics.platformRevenueUsd).toBe(0.15);
      expect(analytics.partnerRevenueUsd).toBe(0);
      expect(analytics.transactionCount).toBe(2);
      expect(analytics.averageTransactionSize).toBe(1500);
    });

    it('should handle different periods', async () => {
      const periods = ['1d', '7d', '30d', '90d'];
      
      for (const period of periods) {
        const analytics = await monetizationService.generateRevenueAnalytics(period);
        expect(analytics.period).toBe(period);
        expect(analytics.totalVolumeUsd).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('fee structure management', () => {
    it('should return current fee structure', async () => {
      const feeStructure = await monetizationService.getFeeStructure();

      expect(feeStructure.serviceFeeBps).toBe(5);
      expect(feeStructure.minFeeUsd).toBe(0.01);
      expect(feeStructure.maxFeeUsd).toBe(10);
      expect(feeStructure.partnerSharePercent).toBe(30);
      expect(feeStructure.volumeDiscountTiers).toHaveLength(5);
    });

    it('should update fee structure correctly', async () => {
      await monetizationService.updateFeeStructure({
        serviceFeeBps: 10, // 0.1%
        minFeeUsd: 0.02,
        maxFeeUsd: 20,
      });

      const feeStructure = await monetizationService.getFeeStructure();
      expect(feeStructure.serviceFeeBps).toBe(10);
      expect(feeStructure.minFeeUsd).toBe(0.02);
      expect(feeStructure.maxFeeUsd).toBe(20);
    });
  });
});