import { z } from 'zod'

// 수익화 관련 타입 정의
export const FeeStructureSchema = z.object({
  serviceFeeBps: z.number().int().min(0).max(1000), // 서비스 수수료 (0-10%)
  maxFeeUsd: z.number().positive().optional(), // 최대 수수료 (USD)
  minFeeUsd: z.number().positive().optional(), // 최소 수수료 (USD)
  savingsBasedFee: z.boolean().default(false), // 절감액 기반 수수료 여부
  savingsFeeRatio: z.number().min(0).max(1).default(0.3), // 절감액 대비 수수료 비율
})

export type FeeStructure = z.infer<typeof FeeStructureSchema>

export const RevenueShareSchema = z.object({
  partnerId: z.string(),
  partnerName: z.string(),
  sharePercentage: z.number().min(0).max(1), // 0-100%
  referralCode: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type RevenueShare = z.infer<typeof RevenueShareSchema>

export const PremiumFeatureSchema = z.object({
  name: z.string(),
  description: z.string(),
  priceUsd: z.number().positive(),
  billingType: z.enum(['per_transaction', 'monthly', 'yearly']),
  features: z.array(z.string()),
  isActive: z.boolean().default(true),
})

export type PremiumFeature = z.infer<typeof PremiumFeatureSchema>

export const WhiteLabelConfigSchema = z.object({
  partnerId: z.string(),
  brandName: z.string(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  customDomain: z.string().optional(),
  features: z.array(z.string()),
  feeStructure: FeeStructureSchema,
  revenueShare: RevenueShareSchema.optional(),
})

export type WhiteLabelConfig = z.infer<typeof WhiteLabelConfigSchema>

export const TransactionReceiptSchema = z.object({
  transactionId: z.string(),
  timestamp: z.number(),
  fromToken: z.string(),
  toToken: z.string(),
  amountIn: z.string(),
  amountOut: z.string(),
  route: z.string(),
  provider: z.string(),
  costBreakdown: z.object({
    gasUsd: z.number(),
    protocolFeesUsd: z.number(),
    aggregatorFeesUsd: z.number(),
    serviceFeesUsd: z.number(),
    slippageUsd: z.number(),
    totalCostUsd: z.number(),
  }),
  savings: z.object({
    vsBestAlternative: z.number(),
    vsTraditionalExchange: z.number(),
    savingsPercentage: z.number(),
  }),
  riskScore: z.number().min(0).max(100),
  partnerId: z.string().optional(),
})

export type TransactionReceipt = z.infer<typeof TransactionReceiptSchema>