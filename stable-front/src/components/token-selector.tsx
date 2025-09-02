'use client'

import { useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTokensByChainId, getTokenBySymbol } from 'shared'

interface TokenSelectorProps {
  value: string
  onChange: (token: string) => void
  chainId: number
}

export function TokenSelector({ value, onChange, chainId }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const tokens = getTokensByChainId(chainId)
  const selectedToken = getTokenBySymbol(value, chainId)
  const filteredTokens = tokens.filter(token =>
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors min-w-[120px]"
      >
        <span className="font-medium">{selectedToken?.symbol || 'Select'}</span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredTokens.map((token) => (
              <button
                key={`${token.chainId}-${token.address}`}
                onClick={() => {
                  onChange(token.symbol)
                  setIsOpen(false)
                  setSearchTerm('')
                }}
                className={cn(
                  "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                  token.symbol === value && "bg-blue-50 text-blue-600"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-sm text-gray-500">{token.name}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}