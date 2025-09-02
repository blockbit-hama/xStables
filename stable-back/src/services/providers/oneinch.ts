import axios from 'axios'
import { QuoteRequest, ProviderQuote } from '../../types'
import { config } from '../../config'

export class OneInchProvider {
  private baseUrl = 'https://api.1inch.io/v5.0'

  async getQuote(request: QuoteRequest): Promise<ProviderQuote> {
    try {
      const chainId = this.mapChainId(request.chainId)
      const params = {
        fromTokenAddress: request.fromToken,
        toTokenAddress: request.toToken,
        amount: request.amount,
        slippage: request.slippageBps / 100
      }

      const response = await axios.get(`${this.baseUrl}/${chainId}/quote`, {
        params,
        headers: {
          'Authorization': `Bearer ${config.ONEINCH_API_KEY || ''}`
        },
        timeout: 5000
      })

      const data = response.data

      return {
        outputAmount: data.toTokenAmount,
        provider: '1inch',
        gasUsd: 0, // Will be calculated by QuoteService
        feesUsd: this.calculateFeesUsd(data),
        slippageUsd: this.calculateSlippageUsd(data, request),
        totalValue: 0, // Will be calculated by QuoteService
        callData: '', // 1inch requires separate swap call
        to: '', // Will be set by swap call
        value: '0'
      }
    } catch (error) {
      console.error('1inch API error:', error)
      throw new Error(`1inch quote failed: ${error}`)
    }
  }

  async getSwapData(request: QuoteRequest): Promise<{ callData: string; to: string; value: string }> {
    try {
      const chainId = this.mapChainId(request.chainId)
      const params = {
        fromTokenAddress: request.fromToken,
        toTokenAddress: request.toToken,
        amount: request.amount,
        slippage: request.slippageBps / 100,
        fromAddress: '0x0000000000000000000000000000000000000000' // Will be replaced by user address
      }

      const response = await axios.get(`${this.baseUrl}/${chainId}/swap`, {
        params,
        headers: {
          'Authorization': `Bearer ${config.ONEINCH_API_KEY || ''}`
        },
        timeout: 5000
      })

      const data = response.data

      return {
        callData: data.tx.data,
        to: data.tx.to,
        value: data.tx.value || '0'
      }
    } catch (error) {
      console.error('1inch swap API error:', error)
      throw new Error(`1inch swap failed: ${error}`)
    }
  }

  private mapChainId(chainId: number): number {
    const mapping = {
      1: 1, // Ethereum
      42161: 42161, // Arbitrum
      10: 10, // Optimism
      137: 137, // Polygon
      8217: 8217 // Klaytn (if supported)
    }

    return mapping[chainId as keyof typeof mapping] || chainId
  }

  private calculateFeesUsd(data: any): number {
    // 1inch protocol fee in USD
    const protocolFee = parseFloat(data.protocolFee || '0')
    const gasPrice = parseFloat(data.gasPrice || '0')
    const gas = parseFloat(data.gas || '0')
    
    // Convert to USD (simplified)
    const ethPriceUsd = 2000 // TODO: Get from price oracle
    const gasCostEth = (gasPrice * gas) / 1e18
    const gasCostUsd = gasCostEth * ethPriceUsd
    
    return gasCostUsd + (protocolFee / 1e18) * ethPriceUsd
  }

  private calculateSlippageUsd(data: any, request: QuoteRequest): number {
    const expectedOutput = parseFloat(data.toTokenAmount)
    const minOutput = expectedOutput * (1 - request.slippageBps / 10000)
    const slippageAmount = expectedOutput - minOutput
    
    // Convert to USD (simplified)
    return slippageAmount * 1 // Assuming 1:1 USD for stablecoins
  }
}