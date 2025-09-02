'use client'

import { AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RiskIndicatorProps {
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  warnings?: string[]
  recommendations?: string[]
  canProceed?: boolean
}

export function RiskIndicator({ 
  riskScore, 
  riskLevel, 
  warnings = [], 
  recommendations = [],
  canProceed = true 
}: RiskIndicatorProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'high':
        return 'text-orange-600 bg-orange-100'
      case 'critical':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low':
        return <CheckCircle className="h-4 w-4" />
      case 'medium':
        return <Shield className="h-4 w-4" />
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'critical':
        return <XCircle className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getRiskMessage = (level: string) => {
    switch (level) {
      case 'low':
        return 'Low risk - Safe to proceed'
      case 'medium':
        return 'Medium risk - Proceed with caution'
      case 'high':
        return 'High risk - Consider alternatives'
      case 'critical':
        return 'Critical risk - Transaction blocked'
      default:
        return 'Risk assessment unavailable'
    }
  }

  return (
    <div className="space-y-3">
      {/* Risk Score */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Risk Assessment</span>
        <div className={cn(
          "flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium",
          getRiskColor(riskLevel)
        )}>
          {getRiskIcon(riskLevel)}
          <span>{riskLevel.toUpperCase()}</span>
        </div>
      </div>

      {/* Risk Score Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            riskLevel === 'low' && "bg-green-500",
            riskLevel === 'medium' && "bg-yellow-500",
            riskLevel === 'high' && "bg-orange-500",
            riskLevel === 'critical' && "bg-red-500"
          )}
          style={{ width: `${riskScore}%` }}
        />
      </div>

      <div className="text-xs text-gray-500 text-center">
        Risk Score: {riskScore}/100
      </div>

      {/* Risk Message */}
      <div className={cn(
        "p-3 rounded-lg text-sm",
        riskLevel === 'low' && "bg-green-50 text-green-800",
        riskLevel === 'medium' && "bg-yellow-50 text-yellow-800",
        riskLevel === 'high' && "bg-orange-50 text-orange-800",
        riskLevel === 'critical' && "bg-red-50 text-red-800"
      )}>
        {getRiskMessage(riskLevel)}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Warnings</h4>
          <div className="space-y-1">
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-start space-x-2 text-sm text-orange-700">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Recommendations</h4>
          <div className="space-y-1">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-2 text-sm text-blue-700">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proceed Status */}
      <div className={cn(
        "p-3 rounded-lg text-sm font-medium text-center",
        canProceed 
          ? "bg-green-50 text-green-800 border border-green-200"
          : "bg-red-50 text-red-800 border border-red-200"
      )}>
        {canProceed ? (
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Transaction can proceed</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <XCircle className="h-4 w-4" />
            <span>Transaction blocked due to high risk</span>
          </div>
        )}
      </div>
    </div>
  )
}