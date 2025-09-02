import axios from 'axios'
import { QuoteRequest, ProviderQuote } from '../../types'
import { config } from '../../config'

export class ZeroXProvider {
  private baseUrl = 'https://api.0x.org/swap/v1'

  async getQuote(request: QuoteRequest): Promise<ProviderQuote> {
    try {
      const params = {
        sellToken: request.fromToken,
        buyToken: request.toToken,
        sellAmount: request.amount,
        slippagePercentage: request.slippageBps / 10000,
        skipValidation: false,
        intentOnFilling: false
      }

      const response = await axios.get(`${this.baseUrl}/quote`, {
        params,
        headers: {
          '0x-api-key': config.ZEROX_API_KEY || ''
        },
        timeout: 5000
      })

      const data = response.data

      return {
        outputAmount: data.buyAmount,
        provider: '0x',
        gasUsd: 0, // Will be calculated by QuoteService
        feesUsd: this.calculateFeesUsd(data),
        slippageUsd: this.calculateSlippageUsd(data, request),
        totalValue: 0, // Will be calculated by QuoteService
        callData: data.data,
        to: data.to,
        value: data.value || '0',
        allowanceTarget: data.allowanceTarget
      }
    } catch (error) {
      console.error('0x API error:', error)
      throw new Error(`0x quote failed: ${error}`)
    }
  }

  private calculateFeesUsd(data: any): number {
    // 0x protocol fee in USD
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
    const expectedOutput = parseFloat(data.buyAmount)
    const minOutput = expectedOutput * (1 - request.slippageBps / 10000)
    const slippageAmount = expectedOutput - minOutput
    
    // Convert to USD (simplified)
    return slippageAmount * 1 // Assuming 1:1 USD for stablecoins
  }
}