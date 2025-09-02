import { TxBuildRequest, TxBuildResponse } from '../types'
import { QuoteService } from './quote'
import { GasEstimator } from './gas-estimator'
import { config } from '../config'

export class TransactionService {
  private quoteService: QuoteService
  private gasEstimator: GasEstimator

  constructor() {
    this.quoteService = new QuoteService()
    this.gasEstimator = new GasEstimator()
  }

  async buildTransaction(request: TxBuildRequest): Promise<TxBuildResponse> {
    // Get the best quote
    const quote = await this.quoteService.getBestQuote({
      chainId: request.chainId,
      fromToken: request.fromToken,
      toToken: request.toToken,
      amount: request.amount,
      slippageBps: request.slippageBps
    })

    const bestRoute = quote.bestRoute

    // Check if approval is needed
    const needsApproval = await this.checkApprovalNeeded(
      request.chainId,
      request.fromToken,
      request.userAddress,
      bestRoute.allowanceTarget || bestRoute.to
    )

    const gasPrice = await this.gasEstimator.getGasPrice(request.chainId)
    const gasLimit = await this.gasEstimator.estimateGasLimit(
      request.chainId,
      bestRoute.callData
    )

    const response: TxBuildResponse = {
      swapTx: {
        to: bestRoute.to,
        data: bestRoute.callData,
        value: bestRoute.value,
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString()
      }
    }

    // Add approval transaction if needed
    if (needsApproval && bestRoute.allowanceTarget) {
      const approveData = await this.buildApproveTransaction(
        request.fromToken,
        bestRoute.allowanceTarget,
        request.amount
      )

      response.approveTx = {
        to: request.fromToken,
        data: approveData,
        value: '0',
        gasLimit: '100000', // Standard approval gas limit
        gasPrice: gasPrice.toString()
      }
    }

    return response
  }

  async simulateTransaction(params: {
    chainId: number
    to: string
    data: string
    value: string
    from: string
  }): Promise<{ success: boolean; gasUsed?: string; error?: string }> {
    try {
      const result = await this.gasEstimator.simulateTransaction(params)
      return {
        success: true,
        gasUsed: result.gasUsed
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Simulation failed'
      }
    }
  }

  private async checkApprovalNeeded(
    chainId: number,
    tokenAddress: string,
    userAddress: string,
    spenderAddress: string
  ): Promise<boolean> {
    // TODO: Implement actual allowance check
    // For now, assume approval is always needed for non-native tokens
    return tokenAddress !== '0x0000000000000000000000000000000000000000'
  }

  private async buildApproveTransaction(
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ): Promise<string> {
    // TODO: Implement actual approve transaction building
    // This would use viem to encode the approve function call
    return '0x095ea7b3000000000000000000000000' + spenderAddress.slice(2) + amount.slice(2)
  }
}