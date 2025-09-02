import { CHAIN_IDS, type Chain, type Token } from '../types'

// Supported Chains
export const SUPPORTED_CHAINS: Chain[] = [
  {
    chainId: CHAIN_IDS.ETHEREUM,
    name: 'Ethereum',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
  },
  {
    chainId: CHAIN_IDS.ARBITRUM,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
  },
  {
    chainId: CHAIN_IDS.OPTIMISM,
    name: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
  },
  {
    chainId: CHAIN_IDS.POLYGON,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18,
    },
    isTestnet: false,
  },
  {
    chainId: CHAIN_IDS.KLAYTN,
    name: 'Klaytn',
    rpcUrl: 'https://public-node-api.klaytnapi.com/v1/cypress',
    blockExplorer: 'https://scope.klaytn.com',
    nativeCurrency: {
      name: 'Klay',
      symbol: 'KLAY',
      decimals: 18,
    },
    isTestnet: false,
  },
]

// Supported Tokens
export const SUPPORTED_TOKENS: Token[] = [
  // Ethereum
  {
    address: '0xA0b86a33E6441b8c4C8C0E4b8c4C8C0E4b8c4C8C0',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: CHAIN_IDS.ETHEREUM,
    pegCurrency: 'USD',
    tags: ['stable', 'usd'],
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chainId: CHAIN_IDS.ETHEREUM,
    pegCurrency: 'USD',
    tags: ['stable', 'usd'],
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    chainId: CHAIN_IDS.ETHEREUM,
    pegCurrency: 'USD',
    tags: ['stable', 'usd', 'decentralized'],
  },
  
  // Arbitrum
  {
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: CHAIN_IDS.ARBITRUM,
    pegCurrency: 'USD',
    tags: ['stable', 'usd'],
  },
  {
    address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chainId: CHAIN_IDS.ARBITRUM,
    pegCurrency: 'USD',
    tags: ['stable', 'usd'],
  },
  {
    address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    chainId: CHAIN_IDS.ARBITRUM,
    pegCurrency: 'USD',
    tags: ['stable', 'usd', 'decentralized'],
  },
  
  // Optimism
  {
    address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: CHAIN_IDS.OPTIMISM,
    pegCurrency: 'USD',
    tags: ['stable', 'usd'],
  },
  {
    address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chainId: CHAIN_IDS.OPTIMISM,
    pegCurrency: 'USD',
    tags: ['stable', 'usd'],
  },
  {
    address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    chainId: CHAIN_IDS.OPTIMISM,
    pegCurrency: 'USD',
    tags: ['stable', 'usd', 'decentralized'],
  },
  
  // Polygon
  {
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: CHAIN_IDS.POLYGON,
    pegCurrency: 'USD',
    tags: ['stable', 'usd'],
  },
  {
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chainId: CHAIN_IDS.POLYGON,
    pegCurrency: 'USD',
    tags: ['stable', 'usd'],
  },
  {
    address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    chainId: CHAIN_IDS.POLYGON,
    pegCurrency: 'USD',
    tags: ['stable', 'usd', 'decentralized'],
  },
  
  // Klaytn
  {
    address: '0x6270B58BE569a7c0b8f47594F191631Ae5b2C86C',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: CHAIN_IDS.KLAYTN,
    pegCurrency: 'USD',
    tags: ['stable', 'usd'],
  },
  {
    address: '0xceE8FAF64bE97aF5a7016412E8a34b4932325Ee7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chainId: CHAIN_IDS.KLAYTN,
    pegCurrency: 'USD',
    tags: ['stable', 'usd'],
  },
  {
    address: '0x...', // Placeholder for KRW stablecoin
    symbol: 'KRWx',
    name: 'KRW Stablecoin',
    decimals: 18,
    chainId: CHAIN_IDS.KLAYTN,
    pegCurrency: 'KRW',
    tags: ['stable', 'krw'],
  },
  {
    address: '0x...', // Placeholder for KRT
    symbol: 'KRT',
    name: 'Klaytn KRW',
    decimals: 18,
    chainId: CHAIN_IDS.KLAYTN,
    pegCurrency: 'KRW',
    tags: ['stable', 'krw'],
  },
]

// Quote Providers
export const QUOTE_PROVIDERS = [
  {
    name: '0x',
    description: '0x Protocol aggregator',
    supportedChains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM, CHAIN_IDS.OPTIMISM, CHAIN_IDS.POLYGON, CHAIN_IDS.KLAYTN],
    feeBps: 0, // No additional fee
  },
  {
    name: '1inch',
    description: '1inch DEX aggregator',
    supportedChains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM, CHAIN_IDS.OPTIMISM, CHAIN_IDS.POLYGON],
    feeBps: 0, // No additional fee
  },
  {
    name: 'Uniswap V3',
    description: 'Uniswap V3 direct integration',
    supportedChains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM, CHAIN_IDS.OPTIMISM, CHAIN_IDS.POLYGON],
    feeBps: 0, // No additional fee
  },
  {
    name: 'Uniswap V2',
    description: 'Uniswap V2 direct integration',
    supportedChains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM, CHAIN_IDS.OPTIMISM, CHAIN_IDS.POLYGON],
    feeBps: 0, // No additional fee
  },
]

// Bridge Providers
export const BRIDGE_PROVIDERS = [
  {
    name: 'LiFi',
    description: 'LiFi bridge aggregator',
    supportedChains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM, CHAIN_IDS.OPTIMISM, CHAIN_IDS.POLYGON],
    estimatedTime: 300, // 5 minutes
  },
  {
    name: 'Across',
    description: 'Across Protocol bridge',
    supportedChains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM, CHAIN_IDS.OPTIMISM, CHAIN_IDS.POLYGON],
    estimatedTime: 180, // 3 minutes
  },
  {
    name: 'Synapse',
    description: 'Synapse Protocol bridge',
    supportedChains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM, CHAIN_IDS.OPTIMISM, CHAIN_IDS.POLYGON],
    estimatedTime: 600, // 10 minutes
  },
]

// Default Settings
export const DEFAULT_SETTINGS = {
  slippageBps: 50, // 0.5%
  maxSlippageBps: 1000, // 10%
  quoteTTL: 30000, // 30 seconds
  gasBufferBps: 1000, // 10%
  protocolFeeBps: 5, // 0.05%
  minAmountUsd: 1,
  maxAmountUsd: 1000000,
} as const

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_CHAIN: 'Unsupported chain',
  INVALID_TOKEN: 'Token not supported',
  INVALID_AMOUNT: 'Invalid amount',
  INVALID_SLIPPAGE: 'Slippage too high',
  QUOTE_EXPIRED: 'Quote has expired',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  TRANSACTION_FAILED: 'Transaction failed',
  PROVIDER_ERROR: 'Provider error',
  NETWORK_ERROR: 'Network error',
  UNKNOWN_ERROR: 'Unknown error occurred',
} as const

// API Endpoints
export const API_ENDPOINTS = {
  QUOTE: '/api/quote',
  TX_BUILD: '/api/tx/build',
  TX_SIMULATE: '/api/tx/simulate',
  HEALTH: '/api/health',
  TOKENS: '/api/tokens',
  CHAINS: '/api/chains',
  PROVIDERS: '/api/providers',
} as const