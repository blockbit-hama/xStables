import { z } from 'zod'

// Quote Request Schema
export const QuoteRequestSchema = z.object({
  chainId: z.number().int().positive(),
  fromToken: z.string().min(1),
  toToken: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  slippageBps: z.number().int().min(1).max(1000).default(50)
})

export type QuoteRequest = z.infer<typeof QuoteRequestSchema>

// Quote Response Schema
export const QuoteResponseSchema = z.object({
  bestRoute: z.object({
    outputAmount: z.string(),
    provider: z.string(),
    gasUsd: z.number(),
    feesUsd: z.number(),
    slippageUsd: z.number(),
    totalValue: z.number(),
    callData: z.string(),
    to: z.string(),
    value: z.string(),
    allowanceTarget: z.string().optional()
  }),
  alternatives: z.array(z.object({
    outputAmount: z.string(),
    provider: z.string(),
    gasUsd: z.number(),
    feesUsd: z.number(),
    slippageUsd: z.number(),
    totalValue: z.number()
  })),
  breakdown: z.object({
    gasUsd: z.number(),
    feesUsd: z.number(),
    slippageUsd: z.number()
  }),
  expiresAt: z.number()
})

export type QuoteResponse = z.infer<typeof QuoteResponseSchema>

// Transaction Build Request Schema
export const TxBuildRequestSchema = z.object({
  chainId: z.number().int().positive(),
  fromToken: z.string().min(1),
  toToken: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  slippageBps: z.number().int().min(1).max(1000).default(50),
  userAddress: z.string().min(1)
})

export type TxBuildRequest = z.infer<typeof TxBuildRequestSchema>

// Transaction Build Response Schema
export const TxBuildResponseSchema = z.object({
  approveTx: z.object({
    to: z.string(),
    data: z.string(),
    value: z.string(),
    gasLimit: z.string(),
    gasPrice: z.string()
  }).optional(),
  swapTx: z.object({
    to: z.string(),
    data: z.string(),
    value: z.string(),
    gasLimit: z.string(),
    gasPrice: z.string()
  })
})

export type TxBuildResponse = z.infer<typeof TxBuildResponseSchema>

// Provider Quote Schema
export const ProviderQuoteSchema = z.object({
  outputAmount: z.string(),
  provider: z.string(),
  gasUsd: z.number(),
  feesUsd: z.number(),
  slippageUsd: z.number(),
  totalValue: z.number(),
  callData: z.string(),
  to: z.string(),
  value: z.string(),
  allowanceTarget: z.string().optional()
})

export type ProviderQuote = z.infer<typeof ProviderQuoteSchema>

// Token Info Schema
export const TokenInfoSchema = z.object({
  address: z.string(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.number().int().min(0).max(18),
  chainId: z.number().int().positive(),
  pegCurrency: z.string().optional(),
  tags: z.array(z.string()).optional()
})

export type TokenInfo = z.infer<typeof TokenInfoSchema>

// Chain Info Schema
export const ChainInfoSchema = z.object({
  chainId: z.number().int().positive(),
  name: z.string(),
  rpcUrl: z.string().url(),
  blockExplorer: z.string().url().optional(),
  nativeCurrency: z.object({
    name: z.string(),
    symbol: z.string(),
    decimals: z.number().int().min(0).max(18)
  })
})

export type ChainInfo = z.infer<typeof ChainInfoSchema>

// Error Response Schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.any().optional()
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>