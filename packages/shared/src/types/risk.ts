import { z } from 'zod'

// 리스크 관리 관련 타입 정의
export const RiskThresholdSchema = z.object({
  depegThresholdBps: z.number().int().min(0).max(1000), // 디페그 임계값 (0-10%)
  minTvlUsd: z.number().positive(), // 최소 TVL
  maxSlippageBps: z.number().int().min(0).max(1000), // 최대 슬리피지
  maxVolumeUsd: z.number().positive(), // 최대 거래량
  minLiquidityUsd: z.number().positive(), // 최소 유동성
})

export type RiskThreshold = z.infer<typeof RiskThresholdSchema>

export const TokenRiskProfileSchema = z.object({
  tokenAddress: z.string(),
  symbol: z.string(),
  riskScore: z.number().min(0).max(100),
  riskFactors: z.array(z.object({
    type: z.enum(['depeg', 'low_liquidity', 'high_slippage', 'blacklist', 'regulatory']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string(),
    lastUpdated: z.number(),
  })),
  isWhitelisted: z.boolean(),
  isBlacklisted: z.boolean(),
  lastRiskCheck: z.number(),
})

export type TokenRiskProfile = z.infer<typeof TokenRiskProfileSchema>

export const DepegAlertSchema = z.object({
  tokenAddress: z.string(),
  symbol: z.string(),
  currentPrice: z.number(),
  targetPrice: z.number(),
  deviationBps: z.number(),
  thresholdBps: z.number(),
  severity: z.enum(['warning', 'critical']),
  timestamp: z.number(),
  isResolved: z.boolean().default(false),
})

export type DepegAlert = z.infer<typeof DepegAlertSchema>

export const LiquidityRiskSchema = z.object({
  tokenAddress: z.string(),
  poolAddress: z.string(),
  currentTvl: z.number(),
  minTvl: z.number(),
  priceImpact: z.number(), // 가격 충격 (0-100%)
  maxTradeSize: z.number(), // 최대 거래 크기
  lastUpdated: z.number(),
})

export type LiquidityRisk = z.infer<typeof LiquidityRiskSchema>

export const RiskAssessmentSchema = z.object({
  overallRiskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  recommendations: z.array(z.string()),
  warnings: z.array(z.string()),
  canProceed: z.boolean(),
  alternativeRoutes: z.array(z.string()).optional(),
})

export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>