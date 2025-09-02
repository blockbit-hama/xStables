import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './use-debounce'
import { QuoteRequest, QuoteResponse } from 'shared'

interface UseQuoteOptions {
  chainId: number
  fromToken: string
  toToken: string
  amount: string
  slippageBps: number
  enabled?: boolean
}

export function useQuote({
  chainId,
  fromToken,
  toToken,
  amount,
  slippageBps,
  enabled = true
}: UseQuoteOptions) {
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedAmount = useDebounce(amount, 300)

  const fetchQuote = useCallback(async () => {
    if (!enabled || !debouncedAmount || parseFloat(debouncedAmount) <= 0) {
      setQuote(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chainId,
          fromToken,
          toToken,
          amount: debouncedAmount,
          slippageBps,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setQuote(data)
    } catch (err) {
      console.error('Failed to fetch quote:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch quote')
      setQuote(null)
    } finally {
      setIsLoading(false)
    }
  }, [chainId, fromToken, toToken, debouncedAmount, slippageBps, enabled])

  useEffect(() => {
    fetchQuote()
  }, [fetchQuote])

  const refetch = useCallback(() => {
    fetchQuote()
  }, [fetchQuote])

  return {
    quote,
    isLoading,
    error,
    refetch,
  }
}