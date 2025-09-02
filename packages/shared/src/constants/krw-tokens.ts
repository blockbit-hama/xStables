import { CHAIN_IDS, type Token } from '../types'

// KRW 스테이블코인 전용 상수
export const KRW_STABLE_TOKENS: Token[] = [
  // Klaytn KRW 스테이블
  {
    address: '0x...', // KRWx 실제 주소로 교체 필요
    symbol: 'KRWx',
    name: 'KRW Stablecoin',
    decimals: 18,
    chainId: CHAIN_IDS.KLAYTN,
    pegCurrency: 'KRW',
    tags: ['stable', 'krw', 'whitelisted'],
  },
  {
    address: '0x...', // KRT 실제 주소로 교체 필요
    symbol: 'KRT',
    name: 'Klaytn KRW',
    decimals: 18,
    chainId: CHAIN_IDS.KLAYTN,
    pegCurrency: 'KRW',
    tags: ['stable', 'krw', 'whitelisted'],
  },
  // 기타 KRW 스테이블 (향후 추가)
  {
    address: '0x...', // 예시
    symbol: 'KRWc',
    name: 'KRW Coin',
    decimals: 18,
    chainId: CHAIN_IDS.KLAYTN,
    pegCurrency: 'KRW',
    tags: ['stable', 'krw', 'whitelisted'],
  },
]

// KRW 스테이블 전용 리스크 임계값
export const KRW_RISK_THRESHOLDS = {
  depegThresholdBps: 50, // 0.5% 디페그 임계값
  minTvlUsd: 100000, // 최소 $100K TVL
  maxSlippageBps: 100, // 최대 1% 슬리피지
  maxVolumeUsd: 1000000, // 최대 $1M 거래량
  minLiquidityUsd: 50000, // 최소 $50K 유동성
} as const

// KRW 스테이블 우선순위 경로
export const KRW_ROUTE_PRIORITIES = [
  {
    name: 'Direct KRW-KRW',
    description: '직접 KRW 스테이블 간 교환',
    priority: 1,
    maxSlippageBps: 50,
  },
  {
    name: 'KRW-USDC-KRW',
    description: 'USDC 허브를 통한 KRW 교환',
    priority: 2,
    maxSlippageBps: 100,
  },
  {
    name: 'KRW-USDT-KRW',
    description: 'USDT 허브를 통한 KRW 교환',
    priority: 3,
    maxSlippageBps: 150,
  },
] as const

// KRW 환율 정보 (실제로는 API에서 가져와야 함)
export const KRW_EXCHANGE_RATES = {
  USD_TO_KRW: 1300, // 예시 환율
  lastUpdated: Date.now(),
} as const