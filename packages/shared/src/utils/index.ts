import { CHAIN_IDS, type ChainId, type Chain, type Token } from '../types'
import { SUPPORTED_CHAINS, SUPPORTED_TOKENS } from '../constants'

/**
 * Format a number to a specific number of decimal places
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals)
}

/**
 * Format a number as currency
 */
export function formatCurrency(value: number, currency: string = 'USD', decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a large number with K, M, B suffixes
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)}B`
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`
  }
  return value.toFixed(2)
}

/**
 * Convert wei to ether
 */
export function weiToEther(wei: string | bigint): string {
  const weiBigInt = typeof wei === 'string' ? BigInt(wei) : wei
  const ether = Number(weiBigInt) / 1e18
  return ether.toString()
}

/**
 * Convert ether to wei
 */
export function etherToWei(ether: string | number): string {
  const etherNumber = typeof ether === 'string' ? parseFloat(ether) : ether
  const wei = BigInt(Math.floor(etherNumber * 1e18))
  return wei.toString()
}

/**
 * Convert token amount based on decimals
 */
export function formatTokenAmount(amount: string, decimals: number): string {
  const amountBigInt = BigInt(amount)
  const divisor = BigInt(10 ** decimals)
  const formatted = Number(amountBigInt) / Number(divisor)
  return formatted.toString()
}

/**
 * Parse token amount to wei-like format
 */
export function parseTokenAmount(amount: string, decimals: number): string {
  const amountNumber = parseFloat(amount)
  const multiplier = 10 ** decimals
  const parsed = BigInt(Math.floor(amountNumber * multiplier))
  return parsed.toString()
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return (value / total) * 100
}

/**
 * Calculate basis points
 */
export function calculateBasisPoints(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 10000)
}

/**
 * Calculate slippage amount
 */
export function calculateSlippageAmount(amount: string, slippageBps: number): string {
  const amountBigInt = BigInt(amount)
  const slippage = (amountBigInt * BigInt(slippageBps)) / BigInt(10000)
  return slippage.toString()
}

/**
 * Calculate minimum amount out with slippage
 */
export function calculateMinAmountOut(amountOut: string, slippageBps: number): string {
  const amountOutBigInt = BigInt(amountOut)
  const slippage = (amountOutBigInt * BigInt(slippageBps)) / BigInt(10000)
  return (amountOutBigInt - slippage).toString()
}

/**
 * Get chain by chain ID
 */
export function getChainById(chainId: ChainId): Chain | undefined {
  return SUPPORTED_CHAINS.find(chain => chain.chainId === chainId)
}

/**
 * Get chain name by chain ID
 */
export function getChainName(chainId: ChainId): string {
  const chain = getChainById(chainId)
  return chain?.name || `Chain ${chainId}`
}

/**
 * Get tokens by chain ID
 */
export function getTokensByChainId(chainId: ChainId): Token[] {
  return SUPPORTED_TOKENS.filter(token => token.chainId === chainId)
}

/**
 * Get token by address and chain ID
 */
export function getTokenByAddress(address: string, chainId: ChainId): Token | undefined {
  return SUPPORTED_TOKENS.find(token => 
    token.address.toLowerCase() === address.toLowerCase() && 
    token.chainId === chainId
  )
}

/**
 * Get token by symbol and chain ID
 */
export function getTokenBySymbol(symbol: string, chainId: ChainId): Token | undefined {
  return SUPPORTED_TOKENS.find(token => 
    token.symbol.toLowerCase() === symbol.toLowerCase() && 
    token.chainId === chainId
  )
}

/**
 * Check if address is valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, startLength: number = 6, endLength: number = 4): string {
  if (!isValidAddress(address)) return address
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

/**
 * Format time duration
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`
  } else if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h`
  } else {
    return `${Math.floor(seconds / 86400)}d`
  }
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) { // Less than 1 minute
    return 'Just now'
  } else if (diff < 3600000) { // Less than 1 hour
    return `${Math.floor(diff / 60000)}m ago`
  } else if (diff < 86400000) { // Less than 1 day
    return `${Math.floor(diff / 3600000)}h ago`
  } else {
    return `${Math.floor(diff / 86400000)}d ago`
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxAttempts) {
        throw lastError
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

/**
 * Sleep function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate random ID
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  
  return obj
}

/**
 * Check if value is empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return defaultValue
  }
}

/**
 * Safe JSON stringify
 */
export function safeJsonStringify(obj: any, defaultValue: string = '{}'): string {
  try {
    return JSON.stringify(obj)
  } catch {
    return defaultValue
  }
}