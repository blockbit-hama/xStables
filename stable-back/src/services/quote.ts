import { QuoteRequest, QuoteResponse, ProviderQuote } from '../types'
import { ZeroXProvider } from './providers/zerox'
import { OneInchProvider } from './providers/oneinch'
import { UniswapProvider } from './providers/uniswap'
import { GasEstimator } from './gas-estimator'
import { config } from '../config'

export class QuoteService {
  private zeroXProvider: ZeroXProvider
  private oneInchProvider: OneInchProvider
  private uniswapProvider: UniswapProvider
  private gasEstimator: GasEstimator

  constructor() {
    this.zeroXProvider = new ZeroXProvider()
    this.oneInchProvider = new OneInchProvider()
    this.uniswapProvider = new UniswapProvider()
    this.gasEstimator = new GasEstimator()
  }

  async getBestQuote(request: QuoteRequest): Promise<QuoteResponse> {
    // Validate request
    this.validateRequest(request)

    // Get quotes from all providers in parallel
    const quotePromises = [
      this.getZeroXQuote(request).catch(error => ({ error, provider: '0x' })),
      this.getOneInchQuote(request).catch(error => ({ error, provider: '1inch' })),
      this.getUniswapQuote(request).catch(error => ({ error, provider: 'uniswap' }))
    ]

    const results = await Promise.allSettled(quotePromises)
    
    // Filter successful quotes
    const quotes: ProviderQuote[] = []
    const errors: Array<{ provider: string; error: any }> = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const value = result.value
        if ('error' in value) {
          errors.push({ provider: value.provider, error: value.error })
        } else {
          quotes.push(value)
        }
      } else {
        errors.push({ provider: ['0x', '1inch', 'uniswap'][index], error: result.reason })
      }
    })

    if (quotes.length === 0) {
      throw new Error('No quotes available from any provider')
    }

    // Sort quotes by total value (highest first)
    quotes.sort((a, b) => b.totalValue - a.totalValue)

    const bestRoute = quotes[0]
    const alternatives = quotes.slice(1, 3) // Top 2 alternatives

    return {
      bestRoute,
      alternatives,
      breakdown: {
        gasUsd: bestRoute.gasUsd,
        feesUsd: bestRoute.feesUsd,
        slippageUsd: bestRoute.slippageUsd
      },
      expiresAt: Date.now() + config.QUOTE_TTL
    }
  }

  private async getZeroXQuote(request: QuoteRequest): Promise<ProviderQuote> {
    const quote = await this.zeroXProvider.getQuote(request)
    const gasUsd = await this.gasEstimator.estimateGasUsd(request.chainId, quote.callData)
    
    return {
      ...quote,
      gasUsd,
      totalValue: parseFloat(quote.outputAmount) - (gasUsd + quote.feesUsd + quote.slippageUsd)
    }
  }

  private async getOneInchQuote(request: QuoteRequest): Promise<ProviderQuote> {
    const quote = await this.oneInchProvider.getQuote(request)
    const gasUsd = await this.gasEstimator.estimateGasUsd(request.chainId, quote.callData)
    
    return {
      ...quote,
      gasUsd,
      totalValue: parseFloat(quote.outputAmount) - (gasUsd + quote.feesUsd + quote.slippageUsd)
    }
  }

  private async getUniswapQuote(request: QuoteRequest): Promise<ProviderQuote> {
    const quote = await this.uniswapProvider.getQuote(request)
    const gasUsd = await this.gasEstimator.estimateGasUsd(request.chainId, quote.callData)
    
    return {
      ...quote,
      gasUsd,
      totalValue: parseFloat(quote.outputAmount) - (gasUsd + quote.feesUsd + quote.slippageUsd)
    }
  }

  private validateRequest(request: QuoteRequest): void {
    const amount = parseFloat(request.amount)
    
    if (amount < config.MIN_AMOUNT_USD) {
      throw new Error(`Amount too small. Minimum: $${config.MIN_AMOUNT_USD}`)
    }
    
    if (amount > config.MAX_AMOUNT_USD) {
      throw new Error(`Amount too large. Maximum: $${config.MAX_AMOUNT_USD}`)
    }
    
    if (request.slippageBps > config.MAX_SLIPPAGE_BPS) {
      throw new Error(`Slippage too high. Maximum: ${config.MAX_SLIPPAGE_BPS / 100}%`)
    }
    
    if (request.fromToken === request.toToken) {
      throw new Error('From and to tokens cannot be the same')
    }
  }
}