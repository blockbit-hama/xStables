'use client'

import { useState } from 'react'
import { Shield, Zap, Clock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PremiumFeature {
  name: string
  description: string
  priceUsd: number
  billingType: 'per_transaction' | 'monthly' | 'yearly'
  features: string[]
  isActive: boolean
}

interface PremiumFeaturesProps {
  onSelectFeature?: (feature: PremiumFeature) => void
  selectedFeatures?: string[]
}

export function PremiumFeatures({ onSelectFeature, selectedFeatures = [] }: PremiumFeaturesProps) {
  const [features] = useState<PremiumFeature[]>([
    {
      name: 'MEV Protection',
      description: 'Private transaction submission to protect against MEV',
      priceUsd: 0.5,
      billingType: 'per_transaction',
      features: ['Private mempool', 'Bundle submission', 'MEV protection'],
      isActive: true
    },
    {
      name: 'Gasless Transactions',
      description: 'Pay gas fees with tokens instead of native currency',
      priceUsd: 0.1,
      billingType: 'per_transaction',
      features: ['Gasless execution', 'Token payment', 'Auto gas estimation'],
      isActive: true
    },
    {
      name: 'Priority Routing',
      description: 'Faster quote updates and execution priority',
      priceUsd: 9.99,
      billingType: 'monthly',
      features: ['Priority quotes', 'Faster execution', 'SLA guarantee'],
      isActive: true
    }
  ])

  const getFeatureIcon = (featureName: string) => {
    switch (featureName) {
      case 'MEV Protection':
        return <Shield className="h-5 w-5" />
      case 'Gasless Transactions':
        return <Zap className="h-5 w-5" />
      case 'Priority Routing':
        return <Clock className="h-5 w-5" />
      default:
        return <CheckCircle className="h-5 w-5" />
    }
  }

  const formatPrice = (price: number, billingType: string) => {
    switch (billingType) {
      case 'per_transaction':
        return `$${price} per transaction`
      case 'monthly':
        return `$${price}/month`
      case 'yearly':
        return `$${price}/year`
      default:
        return `$${price}`
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Features</h3>
        <p className="text-sm text-gray-600">Enhance your trading experience</p>
      </div>

      <div className="grid gap-4">
        {features.map((feature) => (
          <div
            key={feature.name}
            className={cn(
              "border rounded-lg p-4 cursor-pointer transition-all",
              selectedFeatures.includes(feature.name)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            )}
            onClick={() => onSelectFeature?.(feature)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  selectedFeatures.includes(feature.name)
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                )}>
                  {getFeatureIcon(feature.name)}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{feature.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                  
                  <div className="mt-2">
                    <ul className="text-xs text-gray-500 space-y-1">
                      {feature.features.map((feat, index) => (
                        <li key={index} className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {formatPrice(feature.priceUsd, feature.billingType)}
                </div>
                {selectedFeatures.includes(feature.name) && (
                  <div className="text-xs text-blue-600 mt-1">Selected</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedFeatures.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {selectedFeatures.length} premium feature{selectedFeatures.length > 1 ? 's' : ''} selected
            </span>
          </div>
        </div>
      )}
    </div>
  )
}