import { config as dotenvConfig } from 'dotenv'

dotenvConfig()

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  HOST: process.env.HOST || '0.0.0.0',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/xstables',
  
  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // External APIs
  ZEROX_API_KEY: process.env.ZEROX_API_KEY,
  ONEINCH_API_KEY: process.env.ONEINCH_API_KEY,
  LIFI_API_KEY: process.env.LIFI_API_KEY,
  
  // RPC URLs
  ETHEREUM_RPC: process.env.ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/demo',
  ARBITRUM_RPC: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
  OPTIMISM_RPC: process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io',
  POLYGON_RPC: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
  KLAYTN_RPC: process.env.KLAYTN_RPC || 'https://public-node-api.klaytnapi.com/v1/cypress',
  
  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // Rate limiting
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
  
  // Quote settings
  QUOTE_TTL: parseInt(process.env.QUOTE_TTL || '30000', 10), // 30 seconds
  MAX_SLIPPAGE_BPS: parseInt(process.env.MAX_SLIPPAGE_BPS || '1000', 10), // 10%
  MIN_AMOUNT_USD: parseFloat(process.env.MIN_AMOUNT_USD || '1', 10),
  MAX_AMOUNT_USD: parseFloat(process.env.MAX_AMOUNT_USD || '1000000', 10),
  
  // Gas settings
  GAS_BUFFER_BPS: parseInt(process.env.GAS_BUFFER_BPS || '1000', 10), // 10%
  GAS_PRICE_BUFFER_BPS: parseInt(process.env.GAS_PRICE_BUFFER_BPS || '1000', 10), // 10%
  
  // Monitoring
  ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
  METRICS_PORT: parseInt(process.env.METRICS_PORT || '9090', 10),
} as const