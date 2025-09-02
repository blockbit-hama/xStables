'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { ArrowUpDown, AlertTriangle, CheckCircle, Info, TrendingDown } from 'lucide-react';

// ============ Types ============
interface KRWQuote {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  routes: KRWRoute[];
  bestRoute: KRWRoute;
  krwOptimization: {
    isDirectBetter: boolean;
    directSavingsUsd: number;
    directSavingsPercent: number;
    recommendation: string;
  };
  depegAlerts: DepegAlert[];
  expiresAt: number;
}

interface KRWRoute {
  type: 'direct' | 'usd_hub';
  tokenIn: string;
  tokenOut: string;
  intermediateToken?: string;
  ttvUsd: number;
  savingsUsd: number;
  savingsPercent: number;
  isRecommended: boolean;
}

interface DepegAlert {
  token: string;
  currentPrice: number;
  targetPrice: number;
  deviationBps: number;
  severity: number;
}

interface CostBreakdown {
  gasCostUsd: number;
  protocolFeeUsd: number;
  aggregatorFeeUsd: number;
  lpFeeUsd: number;
  slippageUsd: number;
  serviceFeeUsd: number;
  totalCostUsd: number;
  netAmountOut: number;
}

// ============ KRW Token Configuration ============
const KRW_TOKENS = [
  {
    address: '0x6270B58BE569a7c0b8f47594F191631Ae5b2C86C',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logo: '🟦',
    isKRW: false,
  },
  {
    address: '0xceE8FAF64bE97aF5a7016412E8a34b4932325Ee7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logo: '🟢',
    isKRW: false,
  },
  {
    address: '0x...', // KRWx 주소
    symbol: 'KRWx',
    name: 'KRW Stablecoin',
    decimals: 18,
    logo: '🇰🇷',
    isKRW: true,
  },
  {
    address: '0x...', // KRT 주소
    symbol: 'KRT',
    name: 'Klaytn KRW',
    decimals: 18,
    logo: '🪙',
    isKRW: true,
  },
];

// ============ Main Component ============
export default function KRWSwapWidget() {
  const { address, isConnected } = useAccount();
  const [fromToken, setFromToken] = useState(KRW_TOKENS[0]);
  const [toToken, setToToken] = useState(KRW_TOKENS[2]); // KRWx
  const [amountIn, setAmountIn] = useState('');
  const [quote, setQuote] = useState<KRWQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);

  // ============ Quote Fetching ============
  const fetchQuote = async () => {
    if (!amountIn || !fromToken || !toToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quote/krw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenIn: fromToken.address,
          tokenOut: toToken.address,
          amountIn,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }

      const data = await response.json();
      setQuote(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // ============ Effects ============
  useEffect(() => {
    const timeoutId = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [amountIn, fromToken, toToken]);

  // ============ Token Selection ============
  const handleTokenSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmountIn('');
    setQuote(null);
  };

  // ============ KRW Optimization Display ============
  const renderKRWOptimization = () => {
    if (!quote?.krwOptimization) return null;

    const { isDirectBetter, directSavingsUsd, directSavingsPercent, recommendation } = quote.krwOptimization;

    return (
      <div className={`p-4 rounded-lg border-2 ${
        isDirectBetter 
          ? 'border-green-200 bg-green-50' 
          : 'border-blue-200 bg-blue-50'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {isDirectBetter ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <Info className="w-5 h-5 text-blue-600" />
          )}
          <span className={`font-semibold ${
            isDirectBetter ? 'text-green-800' : 'text-blue-800'
          }`}>
            KRW 최적화 분석
          </span>
        </div>
        
        <p className={`text-sm ${
          isDirectBetter ? 'text-green-700' : 'text-blue-700'
        }`}>
          {recommendation}
        </p>
        
        {isDirectBetter && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingDown className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">
              절감액: ${directSavingsUsd.toFixed(2)} ({directSavingsPercent.toFixed(1)}%)
            </span>
          </div>
        )}
      </div>
    );
  };

  // ============ Depeg Alerts ============
  const renderDepegAlerts = () => {
    if (!quote?.depegAlerts?.length) return null;

    return (
      <div className="space-y-2">
        {quote.depegAlerts.map((alert, index) => (
          <div key={index} className={`p-3 rounded-lg border ${
            alert.severity === 3 
              ? 'border-red-200 bg-red-50' 
              : alert.severity === 2 
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-orange-200 bg-orange-50'
          }`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${
                alert.severity === 3 
                  ? 'text-red-600' 
                  : alert.severity === 2 
                  ? 'text-yellow-600'
                  : 'text-orange-600'
              }`} />
              <span className={`font-medium ${
                alert.severity === 3 
                  ? 'text-red-800' 
                  : alert.severity === 2 
                  ? 'text-yellow-800'
                  : 'text-orange-800'
              }`}>
                디페그 경고
              </span>
            </div>
            <p className={`text-sm mt-1 ${
              alert.severity === 3 
                ? 'text-red-700' 
                : alert.severity === 2 
                ? 'text-yellow-700'
                : 'text-orange-700'
            }`}>
              {alert.token}이 페그에서 {alert.deviationBps} bps ({alert.deviationBps / 100}%) 이탈했습니다.
            </p>
          </div>
        ))}
      </div>
    );
  };

  // ============ Cost Breakdown ============
  const renderCostBreakdown = () => {
    if (!quote?.bestRoute) return null;

    const breakdown = quote.bestRoute.breakdown || {
      gasCostUsd: 0.5,
      protocolFeeUsd: 0.3,
      aggregatorFeeUsd: 0,
      lpFeeUsd: 0.3,
      slippageUsd: 0.2,
      serviceFeeUsd: 0.1,
      totalCostUsd: 1.4,
      netAmountOut: 998.6,
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">비용 분해</span>
          <button
            onClick={() => setShowCostBreakdown(!showCostBreakdown)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showCostBreakdown ? '숨기기' : '자세히 보기'}
          </button>
        </div>

        {showCostBreakdown && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">가스비</span>
              <span>${breakdown.gasCostUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">프로토콜 수수료</span>
              <span>${breakdown.protocolFeeUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">LP 수수료</span>
              <span>${breakdown.lpFeeUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">슬리피지</span>
              <span>${breakdown.slippageUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">서비스 수수료</span>
              <span>${breakdown.serviceFeeUsd.toFixed(2)}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between font-semibold">
              <span>총 비용 (TTV)</span>
              <span>${breakdown.totalCostUsd.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="flex justify-between font-semibold text-lg">
          <span>순 출력 금액</span>
          <span>${breakdown.netAmountOut.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  // ============ Route Comparison ============
  const renderRouteComparison = () => {
    if (!quote?.routes || quote.routes.length <= 1) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-800">라우트 비교</h4>
        {quote.routes.map((route, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              route.isRecommended
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {route.type === 'direct' ? 'KRW 직접' : 'USD 허브 경유'}
                </span>
                {route.isRecommended && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    추천
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">
                  ${route.ttvUsd.toFixed(2)}
                </div>
                {route.savingsUsd > 0 && (
                  <div className="text-xs text-green-600">
                    절감: ${route.savingsUsd.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ============ Main Render ============
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🇰🇷 KRW 스테이블코인 스왑
        </h2>
        <p className="text-sm text-gray-600">
          가장 저렴한 총비용으로 스테이블코인 교환
        </p>
      </div>

      {/* Token Selection */}
      <div className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">From</label>
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{fromToken.logo}</span>
              <div>
                <div className="font-semibold">{fromToken.symbol}</div>
                <div className="text-xs text-gray-500">{fromToken.name}</div>
              </div>
            </div>
            <input
              type="number"
              placeholder="0.0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="flex-1 text-right text-lg font-semibold border-none outline-none"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleTokenSwap}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowUpDown className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">To</label>
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{toToken.logo}</span>
              <div>
                <div className="font-semibold">{toToken.symbol}</div>
                <div className="text-xs text-gray-500">{toToken.name}</div>
              </div>
            </div>
            <div className="flex-1 text-right">
              {loading ? (
                <div className="text-lg font-semibold text-gray-400">계산 중...</div>
              ) : quote ? (
                <div className="text-lg font-semibold text-gray-900">
                  {parseFloat(quote.amountOut).toFixed(6)}
                </div>
              ) : (
                <div className="text-lg font-semibold text-gray-400">0.0</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KRW Optimization */}
      {quote && renderKRWOptimization()}

      {/* Depeg Alerts */}
      {renderDepegAlerts()}

      {/* Cost Breakdown */}
      {quote && renderCostBreakdown()}

      {/* Route Comparison */}
      {quote && renderRouteComparison()}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Swap Button */}
      <button
        disabled={!isConnected || !quote || loading}
        className={`w-full mt-6 py-3 rounded-lg font-semibold transition-colors ${
          !isConnected || !quote || loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {!isConnected
          ? '지갑 연결 필요'
          : !quote
          ? '견적 조회 중...'
          : '스왑 실행'}
      </button>

      {/* Footer */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          💡 KRW 직접 스왑이 더 저렴할 수 있습니다
        </p>
      </div>
    </div>
  );
}