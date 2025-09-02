import { z } from 'zod'

// Chain IDs
export const CHAIN_IDS = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  POLYGON: 137,
  KLAYTN: 8217,
} as const

export type ChainId = typeof CHAIN_IDS[keyof typeof CHAIN_IDS]

// Token Schema
export const TokenSchema = z.object({
  address: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  decimals: z.number().int().min(0).max(18),
  chainId: z.number().int().positive(),
  pegCurrency: z.string().optional(),
  tags: z.array(z.string()).optional(),
  logoURI: z.string().url().optional(),
})

export type Token = z.infer<typeof TokenSchema>

// Chain Schema
export const ChainSchema = z.object({
  chainId: z.number().int().positive(),
  name: z.string().min(1),
  rpcUrl: z.string().url(),
  blockExplorer: z.string().url().optional(),
  nativeCurrency: z.object({
    name: z.string(),
    symbol: z.string(),
    decimals: z.number().int().min(0).max(18),
  }),
  isTestnet: z.boolean().default(false),
})

export type Chain = z.infer<typeof ChainSchema>

// Quote Request Schema
export const QuoteRequestSchema = z.object({
  chainId: z.number().int().positive(),
  fromToken: z.string().min(1),
  toToken: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  slippageBps: z.number().int().min(1).max(1000).default(50),
  userAddress: z.string().optional(),
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
    allowanceTarget: z.string().optional(),
  }),
  alternatives: z.array(z.object({
    outputAmount: z.string(),
    provider: z.string(),
    gasUsd: z.number(),
    feesUsd: z.number(),
    slippageUsd: z.number(),
    totalValue: z.number(),
  })),
  breakdown: z.object({
    gasUsd: z.number(),
    feesUsd: z.number(),
    slippageUsd: z.number(),
  }),
  expiresAt: z.number(),
})

export type QuoteResponse = z.infer<typeof QuoteResponseSchema>

// Transaction Build Request Schema
export const TxBuildRequestSchema = z.object({
  chainId: z.number().int().positive(),
  fromToken: z.string().min(1),
  toToken: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  slippageBps: z.number().int().min(1).max(1000).default(50),
  userAddress: z.string().min(1),
})

export type TxBuildRequest = z.infer<typeof TxBuildRequestSchema>

// Transaction Build Response Schema
export const TxBuildResponseSchema = z.object({
  approveTx: z.object({
    to: z.string(),
    data: z.string(),
    value: z.string(),
    gasLimit: z.string(),
    gasPrice: z.string(),
  }).optional(),
  swapTx: z.object({
    to: z.string(),
    data: z.string(),
    value: z.string(),
    gasLimit: z.string(),
    gasPrice: z.string(),
  }),
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
  allowanceTarget: z.string().optional(),
})

export type ProviderQuote = z.infer<typeof ProviderQuoteSchema>

// Error Response Schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.any().optional(),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

// Swap Widget Props Schema
export const SwapWidgetPropsSchema = z.object({
  chainId: z.number().int().positive().optional(),
  fromToken: z.string().optional(),
  toToken: z.string().optional(),
  amount: z.string().optional(),
  slippageBps: z.number().int().min(1).max(1000).default(50),
  onSwap: z.function().optional(),
  onError: z.function().optional(),
  theme: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    background: z.string().optional(),
    text: z.string().optional(),
  }).optional(),
})

export type SwapWidgetProps = z.infer<typeof SwapWidgetPropsSchema>

// Price Data Schema
export const PriceDataSchema = z.object({
  price: z.number().positive(),
  timestamp: z.number(),
  source: z.string(),
  isValid: z.boolean(),
})

export type PriceData = z.infer<typeof PriceDataSchema>

// Depeg Alert Schema
export const DepegAlertSchema = z.object({
  token: z.string(),
  currentPrice: z.number(),
  targetPrice: z.number(),
  deviation: z.number(),
  threshold: z.number(),
  timestamp: z.number(),
})

export type DepegAlert = z.infer<typeof DepegAlertSchema>

// Bridge Route Schema
export const BridgeRouteSchema = z.object({
  fromChain: z.number().int().positive(),
  toChain: z.number().int().positive(),
  fromToken: z.string(),
  toToken: z.string(),
  amount: z.string(),
  estimatedTime: z.number(),
  fees: z.number(),
  provider: z.string(),
  steps: z.array(z.object({
    type: z.enum(['swap', 'bridge', 'approve']),
    chainId: z.number(),
    token: z.string(),
    amount: z.string(),
    provider: z.string(),
  })),
})

export type BridgeRoute = z.infer<typeof BridgeRouteSchema>

// API Response Schema
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  timestamp: z.number(),
})

export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  timestamp: number
}