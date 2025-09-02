import { createPublicClient, http, encodeFunctionData, parseAbi } from 'viem'
import { QuoteRequest, ProviderQuote } from '../../types'
import { mainnet, arbitrum, optimism, polygon } from 'viem/chains'
import { config } from '../../config'

const chains = {
  1: mainnet,
  42161: arbitrum,
  10: optimism,
  137: polygon
}

const rpcUrls = {
  1: config.ETHEREUM_RPC,
  42161: config.ARBITRUM_RPC,
  10: config.OPTIMISM_RPC,
  137: config.POLYGON_RPC
}

// Uniswap V3 Quoter ABI
const QUOTER_ABI = parseAbi([
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
  'function quoteExactInput(bytes memory path, uint256 amountIn) external returns (uint256 amountOut)'
])

// Uniswap V3 Router ABI
const ROUTER_ABI = parseAbi([
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut)',
  'function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external returns (uint256 amountOut)'
])

const UNISWAP_V3_QUOTER = {
  1: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  42161: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  10: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  137: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'
}

const UNISWAP_V3_ROUTER = {
  1: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  42161: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  10: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  137: '0xE592427A0AEce92De3Edee1F18E0157C05861564'
}

export class UniswapProvider {
  private clients: Map<number, any> = new Map()

  private getClient(chainId: number) {
    if (!this.clients.has(chainId)) {
      const chain = chains[chainId as keyof typeof chains]
      const rpcUrl = rpcUrls[chainId as keyof typeof rpcUrls]
      
      if (!chain || !rpcUrl) {
        throw new Error(`Unsupported chain: ${chainId}`)
      }

      const client = createPublicClient({
        chain,
        transport: http(rpcUrl)
      })

      this.clients.set(chainId, client)
    }

    return this.clients.get(chainId)!
  }

  async getQuote(request: QuoteRequest): Promise<ProviderQuote> {
    try {
      const client = this.getClient(request.chainId)
      const quoterAddress = UNISWAP_V3_QUOTER[request.chainId as keyof typeof UNISWAP_V3_QUOTER]
      
      if (!quoterAddress) {
        throw new Error(`Uniswap V3 not supported on chain ${request.chainId}`)
      }

      // Try different fee tiers (0.05%, 0.3%, 1%)
      const feeTiers = [500, 3000, 10000]
      let bestQuote: any = null
      let bestAmountOut = BigInt(0)

      for (const fee of feeTiers) {
        try {
          const amountOut = await client.readContract({
            address: quoterAddress as `0x${string}`,
            abi: QUOTER_ABI,
            functionName: 'quoteExactInputSingle',
            args: [
              request.fromToken as `0x${string}`,
              request.toToken as `0x${string}`,
              fee,
              BigInt(request.amount),
              BigInt(0) // sqrtPriceLimitX96
            ]
          })

          if (amountOut > bestAmountOut) {
            bestAmountOut = amountOut
            bestQuote = {
              amountOut,
              fee
            }
          }
        } catch (error) {
          // Pool might not exist for this fee tier, continue
          continue
        }
      }

      if (!bestQuote) {
        throw new Error('No Uniswap V3 pool found for this pair')
      }

      // Build swap transaction data
      const callData = await this.buildSwapCallData(request, bestQuote.fee)
      const routerAddress = UNISWAP_V3_ROUTER[request.chainId as keyof typeof UNISWAP_V3_ROUTER]

      return {
        outputAmount: bestQuote.amountOut.toString(),
        provider: 'Uniswap V3',
        gasUsd: 0, // Will be calculated by QuoteService
        feesUsd: this.calculateFeesUsd(bestQuote.fee, request.amount),
        slippageUsd: this.calculateSlippageUsd(bestQuote.amountOut, request),
        totalValue: 0, // Will be calculated by QuoteService
        callData,
        to: routerAddress!,
        value: '0'
      }
    } catch (error) {
      console.error('Uniswap V3 error:', error)
      throw new Error(`Uniswap V3 quote failed: ${error}`)
    }
  }

  private async buildSwapCallData(request: QuoteRequest, fee: number): Promise<string> {
    const routerAddress = UNISWAP_V3_ROUTER[request.chainId as keyof typeof UNISWAP_V3_ROUTER]
    
    const params = {
      tokenIn: request.fromToken as `0x${string}`,
      tokenOut: request.toToken as `0x${string}`,
      fee,
      recipient: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Will be replaced by user address
      deadline: BigInt(Math.floor(Date.now() / 1000) + 1800), // 30 minutes
      amountIn: BigInt(request.amount),
      amountOutMinimum: BigInt(0), // Will be calculated based on slippage
      sqrtPriceLimitX96: BigInt(0)
    }

    return encodeFunctionData({
      abi: ROUTER_ABI,
      functionName: 'exactInputSingle',
      args: [params]
    })
  }

  private calculateFeesUsd(fee: number, amount: string): number {
    // Uniswap V3 fee in USD
    const feeAmount = (parseFloat(amount) * fee) / 1000000 // fee is in basis points
    return feeAmount * 1 // Assuming 1:1 USD for stablecoins
  }

  private calculateSlippageUsd(amountOut: bigint, request: QuoteRequest): number {
    const expectedOutput = parseFloat(amountOut.toString())
    const minOutput = expectedOutput * (1 - request.slippageBps / 10000)
    const slippageAmount = expectedOutput - minOutput
    
    // Convert to USD (simplified)
    return slippageAmount * 1 // Assuming 1:1 USD for stablecoins
  }
}