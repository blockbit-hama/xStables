'use client'

import { Download, Share2, CheckCircle, Clock, DollarSign } from 'lucide-react'
import { formatCurrency, formatLargeNumber } from 'shared'
import { TransactionReceipt as TransactionReceiptType } from 'shared'

interface TransactionReceiptProps {
  receipt: TransactionReceiptType
  onDownload?: () => void
  onShare?: () => void
}

export function TransactionReceipt({ receipt, onDownload, onShare }: TransactionReceiptProps) {
  const formatAmount = (amount: string) => {
    const num = parseFloat(amount)
    return formatLargeNumber(num)
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const handleDownload = () => {
    const receiptData = {
      transactionId: receipt.transactionId,
      timestamp: formatTimestamp(receipt.timestamp),
      fromToken: receipt.fromToken,
      toToken: receipt.toToken,
      amountIn: receipt.amountIn,
      amountOut: receipt.amountOut,
      route: receipt.route,
      provider: receipt.provider,
      costBreakdown: receipt.costBreakdown,
      savings: receipt.savings,
      riskScore: receipt.riskScore
    }

    const blob = new Blob([JSON.stringify(receiptData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transaction-${receipt.transactionId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    onDownload?.()
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'xStables Transaction Receipt',
        text: `Successfully swapped ${formatAmount(receipt.amountIn)} ${receipt.fromToken} for ${formatAmount(receipt.amountOut)} ${receipt.toToken}`,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `xStables Transaction: ${formatAmount(receipt.amountIn)} ${receipt.fromToken} → ${formatAmount(receipt.amountOut)} ${receipt.toToken}`
      )
    }
    onShare?.()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Transaction Complete</h3>
            <p className="text-sm text-gray-500">ID: {receipt.transactionId}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownload}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Download receipt"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Share transaction"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Swap Details */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Swap Details</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">From</span>
              <span className="font-medium">{formatAmount(receipt.amountIn)} {receipt.fromToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">To</span>
              <span className="font-medium">{formatAmount(receipt.amountOut)} {receipt.toToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Route</span>
              <span className="font-medium">{receipt.route}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Provider</span>
              <span className="font-medium">{receipt.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Timestamp</span>
              <span className="font-medium">{formatTimestamp(receipt.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Cost Breakdown</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Gas Fee</span>
              <span className="font-medium">{formatCurrency(receipt.costBreakdown.gasUsd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Protocol Fee</span>
              <span className="font-medium">{formatCurrency(receipt.costBreakdown.protocolFeesUsd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Aggregator Fee</span>
              <span className="font-medium">{formatCurrency(receipt.costBreakdown.aggregatorFeesUsd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Service Fee</span>
              <span className="font-medium">{formatCurrency(receipt.costBreakdown.serviceFeesUsd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Slippage</span>
              <span className="font-medium">{formatCurrency(receipt.costBreakdown.slippageUsd)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between font-semibold">
                <span>Total Cost</span>
                <span>{formatCurrency(receipt.costBreakdown.totalCostUsd)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Savings */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h4 className="font-medium text-green-900">Savings Achieved</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(receipt.savings.vsBestAlternative)}
            </div>
            <div className="text-sm text-green-700">vs Best Alternative</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(receipt.savings.vsTraditionalExchange)}
            </div>
            <div className="text-sm text-green-700">vs Traditional Exchange</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {receipt.savings.savingsPercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-green-700">Total Savings</div>
          </div>
        </div>
      </div>

      {/* Risk Score */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Shield className="h-5 w-5 text-gray-600" />
          <h4 className="font-medium text-gray-900">Risk Assessment</h4>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Risk Score</span>
          <div className="flex items-center space-x-2">
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${receipt.riskScore}%` }}
              />
            </div>
            <span className="font-medium text-gray-900">{receipt.riskScore}/100</span>
          </div>
        </div>
      </div>

      {/* Partner Info */}
      {receipt.partnerId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-800">
              Transaction completed through partner: {receipt.partnerId}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}