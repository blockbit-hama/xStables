'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Wallet } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wallet className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">xStables</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              스왑
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              브리지
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              대시보드
            </a>
          </nav>
          
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}