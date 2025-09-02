'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, DollarSign, Activity, Download, Share2 } from 'lucide-react'
import { formatCurrency, formatLargeNumber } from 'shared'

interface PartnerAnalytics {
  totalTransactions: number
  totalVolume: number
  totalRevenue: number
  partnerShare: number
  platformShare: number
  averageTransactionSize: number
  topTokens: Array<{
    token: string
    volume: number
    transactions: number
  }>
}

interface PartnerDashboardProps {
  partnerId: string
}

export function PartnerDashboard({ partnerId }: PartnerDashboardProps) {
  const [analytics, setAnalytics] = useState<PartnerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month')

  useEffect(() => {
    fetchAnalytics()
  }, [partnerId, period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/partner/analytics/${partnerId}?period=${period}`)
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!analytics) return

    const csvData = [
      ['Metric', 'Value'],
      ['Total Transactions', analytics.totalTransactions],
      ['Total Volume', analytics.totalVolume],
      ['Total Revenue', analytics.totalRevenue],
      ['Partner Share', analytics.partnerShare],
      ['Platform Share', analytics.platformShare],
      ['Average Transaction Size', analytics.averageTransactionSize]
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `partner-analytics-${period}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Partner Dashboard</h2>
          <p className="text-gray-600">Partner ID: {partnerId}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatLargeNumber(analytics.totalTransactions)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.totalVolume)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Partner Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.partnerShare)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.averageTransactionSize)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Partner Share</span>
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(analytics.partnerShare)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(analytics.partnerShare / analytics.totalRevenue) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((analytics.partnerShare / analytics.totalRevenue) * 100).toFixed(1)}% of total revenue
            </p>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Platform Share</span>
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(analytics.platformShare)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-500 h-2 rounded-full"
                style={{ width: `${(analytics.platformShare / analytics.totalRevenue) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((analytics.platformShare / analytics.totalRevenue) * 100).toFixed(1)}% of total revenue
            </p>
          </div>
        </div>
      </div>

      {/* Top Tokens */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Tokens by Volume</h3>
        <div className="space-y-4">
          {analytics.topTokens.map((token, index) => (
            <div key={token.token} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{token.token}</p>
                  <p className="text-sm text-gray-500">{token.transactions} transactions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{formatCurrency(token.volume)}</p>
                <p className="text-sm text-gray-500">
                  {((token.volume / analytics.totalVolume) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Share2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">Integration Resources</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/api/partner/sdk"
            className="block p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
          >
            <h4 className="font-medium text-blue-900">SDK Documentation</h4>
            <p className="text-sm text-blue-700 mt-1">Get started with our SDK</p>
          </a>
          
          <a
            href="/api/partner/white-label"
            className="block p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
          >
            <h4 className="font-medium text-blue-900">White Label Config</h4>
            <p className="text-sm text-blue-700 mt-1">Customize your integration</p>
          </a>
          
          <a
            href="/api/partner/webhook"
            className="block p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
          >
            <h4 className="font-medium text-blue-900">Webhook Setup</h4>
            <p className="text-sm text-blue-700 mt-1">Configure real-time notifications</p>
          </a>
        </div>
      </div>
    </div>
  )
}