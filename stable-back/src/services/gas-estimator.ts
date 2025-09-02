import { createPublicClient, http, formatUnits, parseUnits } from 'viem'
import { mainnet, arbitrum, optimism, polygon, klaytn } from 'viem/chains'
import { config } from '../config'

const chains = {
  1: mainnet,
  42161: arbitrum,
  10: optimism,
  137: polygon,
  8217: klaytn
}

const rpcUrls = {
  1: config.ETHEREUM_RPC,
  42161: config.ARBITRUM_RPC,
  10: config.OPTIMISM_RPC,
  137: config.POLYGON_RPC,
  8217: config.KLAYTN_RPC
}

export class GasEstimator {
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

  async getGasPrice(chainId: number): Promise<bigint> {
    const client = this.getClient(chainId)
    
    try {
      const gasPrice = await client.getGasPrice()
      
      // Add buffer to gas price
      const buffer = BigInt(config.GAS_PRICE_BUFFER_BPS)
      return gasPrice + (gasPrice * buffer) / BigInt(10000)
    } catch (error) {
      console.error('Failed to get gas price:', error)
      // Return fallback gas price
      return parseUnits('20', 'gwei')
    }
  }

  async estimateGasLimit(chainId: number, callData: string): Promise<bigint> {
    const client = this.getClient(chainId)
    
    try {
      const gasEstimate = await client.estimateGas({
        data: callData as `0x${string}`
      })
      
      // Add buffer to gas limit
      const buffer = BigInt(config.GAS_BUFFER_BPS)
      return gasEstimate + (gasEstimate * buffer) / BigInt(10000)
    } catch (error) {
      console.error('Failed to estimate gas limit:', error)
      // Return fallback gas limit
      return BigInt(300000)
    }
  }

  async estimateGasUsd(chainId: number, callData: string): Promise<number> {
    try {
      const [gasPrice, gasLimit] = await Promise.all([
        this.getGasPrice(chainId),
        this.estimateGasLimit(chainId, callData)
      ])

      const gasCostWei = gasPrice * gasLimit
      const gasCostEth = parseFloat(formatUnits(gasCostWei, 18))
      
      // Convert to USD (simplified - in production, use price oracle)
      const ethPriceUsd = await this.getEthPriceUsd(chainId)
      return gasCostEth * ethPriceUsd
    } catch (error) {
      console.error('Failed to estimate gas USD:', error)
      return 0
    }
  }

  async simulateTransaction(params: {
    chainId: number
    to: string
    data: string
    value: string
    from: string
  }): Promise<{ gasUsed: string }> {
    const client = this.getClient(params.chainId)
    
    try {
      const result = await client.call({
        to: params.to as `0x${string}`,
        data: params.data as `0x${string}`,
        value: BigInt(params.value),
        from: params.from as `0x${string}`
      })

      return {
        gasUsed: '0' // Simulation doesn't return gas used
      }
    } catch (error) {
      throw new Error(`Transaction simulation failed: ${error}`)
    }
  }

  private async getEthPriceUsd(chainId: number): Promise<number> {
    // TODO: Implement actual price oracle integration
    // For now, return a static price
    const prices = {
      1: 2000, // Ethereum
      42161: 2000, // Arbitrum
      10: 2000, // Optimism
      137: 2000, // Polygon
      8217: 2000 // Klaytn
    }

    return prices[chainId as keyof typeof prices] || 2000
  }
}