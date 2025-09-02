'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { ArrowUpDown, Loader2, AlertCircle } from 'lucide-react'
import { TokenSelector } from './token-selector'
import { QuoteDisplay } from './quote-display'
import { useQuote } from '@/hooks/use-quote'
import { cn } from '@/lib/utils'
import { getTokenBySymbol, getTokensByChainId } from 'shared'

interface SwapForm {
  fromToken: string
  toToken: string
  amount: string
  chainId: number
  slippageBps: number
}

const initialForm: SwapForm = {
  fromToken: 'USDC',
  toToken: 'DAI',
  amount: '',
  chainId: 42161, // Arbitrum
  slippageBps: 50 // 0.5%
}

export function SwapWidget() {
  const { address, isConnected } = useAccount()
  const { data: wallet } = useWalletClient()
  const [form, setForm] = useState<SwapForm>(initialForm)
  const [isExecuting, setIsExecuting] = useState(false)

  const { 
    quote, 
    isLoading, 
    error, 
    refetch 
  } = useQuote({
    chainId: form.chainId,
    fromToken: form.fromToken,
    toToken: form.toToken,
    amount: form.amount,
    slippageBps: form.slippageBps,
    enabled: !!form.amount && parseFloat(form.amount) > 0
  })

  const handleSwapTokens = () => {
    setForm(prev => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      amount: ''
    }))
  }

  const handleExecute = async () => {
    if (!wallet || !quote || !address) return

    setIsExecuting(true)
    try {
      // TODO: Implement transaction execution
      console.log('Executing swap:', { quote, wallet, address })
      
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Reset form after successful execution
      setForm(prev => ({ ...prev, amount: '' }))
    } catch (error) {
      console.error('Transaction failed:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
      <div className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">From</label>
          <div className="flex items-center space-x-3">
            <TokenSelector
              value={form.fromToken}
              onChange={(token) => setForm(prev => ({ ...prev, fromToken: token }))}
              chainId={form.chainId}
            />
            <input
              type="number"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapTokens}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowUpDown className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">To</label>
          <div className="flex items-center space-x-3">
            <TokenSelector
              value={form.toToken}
              onChange={(token) => setForm(prev => ({ ...prev, toToken: token }))}
              chainId={form.chainId}
            />
            <div className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-gray-500">Getting quote...</span>
                </div>
              ) : quote ? (
                <span className="text-gray-900">
                  {quote.bestRoute.outputAmount}
                </span>
              ) : (
                <span className="text-gray-400">0.00</span>
              )}
            </div>
          </div>
        </div>

        {/* Quote Display */}
        {quote && (
          <QuoteDisplay quote={quote} />
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={!isConnected || !quote || isExecuting}
          className={cn(
            "w-full py-4 rounded-lg font-medium transition-colors",
            isConnected && quote && !isExecuting
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          )}
        >
          {isExecuting ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Executing...</span>
            </div>
          ) : !isConnected ? (
            'Connect Wallet'
          ) : !quote ? (
            'Enter Amount'
          ) : (
            'Execute Swap'
          )}
        </button>
      </div>
    </div>
  )
}