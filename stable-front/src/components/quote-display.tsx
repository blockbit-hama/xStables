'use client'

import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatLargeNumber } from 'shared'
import { QuoteResponse } from 'shared'

interface QuoteDisplayProps {
  quote: QuoteResponse
}

export function QuoteDisplay({ quote }: QuoteDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)

  const savings = quote.alternatives.length > 0 
    ? quote.bestRoute.totalValue - quote.alternatives[0].totalValue
    : 0

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount)
    return formatLargeNumber(num)
  }

  return (
    <div className="space-y-3">
      {/* Main Quote Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Best Route</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {quote.bestRoute.provider}
            </span>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              {formatAmount(quote.bestRoute.outputAmount)}
            </div>
            <div className="text-sm text-gray-500">
              TTV: {formatCurrency(quote.bestRoute.totalValue)}
            </div>
          </div>
        </div>

        {savings > 0 && (
          <div className="flex items-center space-x-1 text-sm text-green-600">
            <Info className="h-4 w-4" />
            <span>You save {formatCurrency(savings)} vs next best route</span>
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium text-gray-700">Cost Breakdown</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-2 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Gas Fee</span>
              <span className="text-gray-900">{formatCurrency(quote.breakdown.gasUsd)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">DEX Fee</span>
              <span className="text-gray-900">{formatCurrency(quote.breakdown.feesUsd)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Slippage</span>
              <span className="text-gray-900">{formatCurrency(quote.breakdown.slippageUsd)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between font-medium">
                <span className="text-gray-700">Total Cost</span>
                <span className="text-gray-900">
                  {formatCurrency(quote.breakdown.gasUsd + quote.breakdown.feesUsd + quote.breakdown.slippageUsd)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alternative Routes */}
      {quote.alternatives.length > 0 && (
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-700">
              Alternative Routes ({quote.alternatives.length})
            </span>
            {showAlternatives ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {showAlternatives && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-200">
              {quote.alternatives.map((alt, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        Route {index + 2}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                        {alt.provider}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatAmount(alt.outputAmount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        TTV: {formatCurrency(alt.totalValue)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Cost: {formatCurrency(alt.gasUsd + alt.feesUsd + alt.slippageUsd)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expiry Info */}
      <div className="text-xs text-gray-500 text-center">
        Quote expires in {Math.ceil((quote.expiresAt - Date.now()) / 1000)}s
      </div>
    </div>
  )
}