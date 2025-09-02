# xStables 설정 가이드

## 📋 목차

1. [사전 요구사항](#사전-요구사항)
2. [환경 설정](#환경-설정)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [API 키 구성](#api-키-구성)
5. [개발 설정](#개발-설정)
6. [스마트 컨트랙트 설정](#스마트-컨트랙트-설정)
7. [프로덕션 배포](#프로덕션-배포)
8. [모니터링 설정](#모니터링-설정)
9. [테스트 실행](#테스트-실행)
10. [문제 해결](#문제-해결)

## 사전 요구사항

### 시스템 요구사항

- **Node.js**: 18.0.0 이상
- **npm**: 8.0.0 이상
- **Git**: 최신 버전
- **Docker**: 로컬 데이터베이스 설정용 (선택사항)

### 필요한 계정

- **Alchemy/Infura**: 블록체인 RPC 접근용
- **0x Protocol**: 견적 집계용 API 키
- **1inch**: DEX 집계용 API 키
- **Supabase**: PostgreSQL 데이터베이스용
- **Upstash**: Redis 캐싱용
- **Vercel**: 프론트엔드 배포용
- **Railway**: 백엔드 배포용
- **Sentry**: 에러 추적용

## 환경 설정

### 1. 저장소 클론

```bash
git clone https://github.com/xstables/xstables.git
cd xstables
```

### 2. 의존성 설치

```bash
# 루트 의존성 설치
npm install

# 모든 워크스페이스 의존성 설치
npm run install:all
```

### 3. 환경 변수 설정

각 서비스에 대한 환경 파일 생성:

#### 백엔드 환경 (stable-back/.env)

```bash
# 예제 파일 복사
cp stable-back/.env.example stable-back/.env
```

```env
# Environment
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/xstables

# Redis
REDIS_URL=redis://localhost:6379

# External APIs
ZEROX_API_KEY=your_0x_api_key_here
ONEINCH_API_KEY=your_1inch_api_key_here

# RPC URLs
ETHEREUM_RPC=https://eth-mainnet.g.alchemy.com/v2/your_api_key
ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC=https://mainnet.optimism.io
POLYGON_RPC=https://polygon-rpc.com
KLAYTN_RPC=https://public-node-api.klaytnapi.com/v1/cypress

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Quote settings
QUOTE_TTL=30000
MAX_SLIPPAGE_BPS=1000
MIN_AMOUNT_USD=1
MAX_AMOUNT_USD=1000000

# Gas settings
GAS_BUFFER_BPS=1000
GAS_PRICE_BUFFER_BPS=1000

# KRW specific settings
KRW_DEPEG_THRESHOLD_BPS=50
KRW_ORACLE_UPDATE_INTERVAL=300

# Monitoring
SENTRY_DSN=your_sentry_dsn
ENABLE_METRICS=true
METRICS_PORT=9090
```

#### 프론트엔드 환경 (stable-front/.env.local)

```env
# API 구성
NEXT_PUBLIC_API_URL=http://localhost:3001

# Wallet Connect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# KRW specific
NEXT_PUBLIC_KLAYTN_CHAIN_ID=8217
NEXT_PUBLIC_KLAYTN_RPC_URL=https://public-node-api.klaytnapi.com/v1/cypress

# 분석 (선택사항)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

#### 컨트랙트 환경 (stable-contract/.env)

```env
# 개인키 (배포용)
PRIVATE_KEY=your_private_key_here

# RPC URLs
ETHEREUM_RPC=https://eth-mainnet.g.alchemy.com/v2/your_api_key
ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC=https://mainnet.optimism.io
POLYGON_RPC=https://polygon-rpc.com
KLAYTN_RPC=https://public-node-api.klaytnapi.com/v1/cypress

# 컨트랙트 검증용 API 키
ETHERSCAN_API_KEY=your_etherscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
OPTIMISTIC_ETHERSCAN_API_KEY=your_optimistic_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# 가스 리포팅
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

## 데이터베이스 설정

### 옵션 1: Docker를 사용한 로컬 PostgreSQL

```bash
# PostgreSQL 컨테이너 시작
docker run --name xstables-postgres \
  -e POSTGRES_DB=xstables \
  -e POSTGRES_USER=xstables \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Redis 컨테이너 시작
docker run --name xstables-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

### 옵션 2: Supabase (프로덕션 권장)

1. [supabase.com](https://supabase.com)에서 계정 생성
2. 새 프로젝트 생성
3. Settings > Database에서 연결 문자열 가져오기
4. 백엔드 환경에서 `DATABASE_URL` 업데이트

### 데이터베이스 스키마 설정

```bash
# 백엔드로 이동
cd stable-back

# Prisma 클라이언트 생성
npx prisma generate

# 마이그레이션 실행
npx prisma db push

# 초기 데이터 시드 (선택사항)
npx prisma db seed
```

### KRW 특화 데이터베이스 스키마

```sql
-- KRW 스테이블코인 정보 테이블
CREATE TABLE krw_stables (
  id SERIAL PRIMARY KEY,
  address VARCHAR(42) UNIQUE NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  decimals INTEGER NOT NULL,
  chain_id INTEGER NOT NULL,
  peg_currency VARCHAR(3) NOT NULL,
  depeg_threshold_bps INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- KRW 견적 테이블
CREATE TABLE krw_quotes (
  id SERIAL PRIMARY KEY,
  token_in VARCHAR(42) NOT NULL,
  token_out VARCHAR(42) NOT NULL,
  amount_in VARCHAR(78) NOT NULL,
  amount_out VARCHAR(78) NOT NULL,
  ttv_usd DECIMAL(18,6) NOT NULL,
  savings_usd DECIMAL(18,6) DEFAULT 0,
  is_direct_better BOOLEAN NOT NULL,
  routes JSONB NOT NULL,
  best_route JSONB NOT NULL,
  krw_optimization JSONB NOT NULL,
  depeg_alerts JSONB DEFAULT '[]',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 디페그 알림 테이블
CREATE TABLE depeg_alerts (
  id SERIAL PRIMARY KEY,
  token VARCHAR(42) NOT NULL,
  current_price DECIMAL(18,6) NOT NULL,
  target_price DECIMAL(18,6) NOT NULL,
  deviation_bps INTEGER NOT NULL,
  severity INTEGER NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_krw_quotes_created_at ON krw_quotes(created_at);
CREATE INDEX idx_krw_quotes_expires_at ON krw_quotes(expires_at);
CREATE INDEX idx_depeg_alerts_token ON depeg_alerts(token);
CREATE INDEX idx_depeg_alerts_created_at ON depeg_alerts(created_at);
```

## API 키 구성

### 1. 0x Protocol API

1. [0x.org](https://0x.org) 방문
2. API 접근을 위해 가입
3. 대시보드에서 API 키 가져오기
4. 백엔드 환경의 `ZEROX_API_KEY`에 추가

### 2. 1inch API

1. [1inch.io](https://1inch.io) 방문
2. API 접근을 위해 등록
3. 개발자 포털에서 API 키 가져오기
4. 백엔드 환경의 `ONEINCH_API_KEY`에 추가

### 3. Alchemy/Infura RPC

1. [alchemy.com](https://alchemy.com) 또는 [infura.io](https://infura.io)에서 계정 생성
2. 각 네트워크에 대해 새 앱 생성
3. RPC URL을 가져와서 환경 변수에 추가

### 4. 클레이튼 RPC

1. [klaytnapi.com](https://klaytnapi.com)에서 계정 생성
2. 메인넷 RPC URL 가져오기
3. 환경 변수에 `KLAYTN_RPC` 추가

### 5. WalletConnect Project ID

1. [cloud.walletconnect.com](https://cloud.walletconnect.com) 방문
2. 새 프로젝트 생성
3. Project ID를 가져와서 프론트엔드 환경에 추가

## 개발 설정

### 1. 개발 서버 시작

```bash
# 개발 모드로 모든 서비스 시작
npm run dev

# 또는 개별 서비스 시작
npm run dev --workspace=stable-front
npm run dev --workspace=stable-back
npm run dev --workspace=stable-contract
```

### 2. 설정 확인

#### 프론트엔드
- [http://localhost:3000](http://localhost:3000) 열기
- 지갑 연결
- KRW 스테이블코인 스왑 테스트

#### 백엔드 API
- [http://localhost:3001/docs](http://localhost:3001/docs) 열기
- API 엔드포인트 테스트
- 헬스 엔드포인트 확인: [http://localhost:3001/api/health](http://localhost:3001/api/health)

#### 스마트 컨트랙트
```bash
cd stable-contract
npm run test
npm run compile
```

### 3. 개발 워크플로우

```bash
# 타입 체크
npm run type-check

# 린팅
npm run lint

# 테스트
npm run test

# 빌드
npm run build
```

## 스마트 컨트랙트 설정

### 1. 컨트랙트 컴파일

```bash
cd stable-contract
npm run compile
```

### 2. 테스트 실행

```bash
# 모든 테스트 실행
npm run test

# 특정 테스트 실행
npm run test -- --grep "KRWStableRouter"

# 가스 리포트 생성
npm run gas-report
```

### 3. 로컬 네트워크 배포

```bash
# Hardhat 노드 시작
npm run node

# 새 터미널에서 배포
npm run deploy:local
```

### 4. 테스트넷 배포

```bash
# 클레이튼 테스트넷 배포
npm run deploy:klaytn-testnet

# 이더리움 테스트넷 배포
npm run deploy:goerli
```

## 프로덕션 배포

### 1. 프론트엔드 배포 (Vercel)

```bash
# Vercel CLI 설치
npm i -g vercel

# 프론트엔드 배포
cd stable-front
vercel --prod

# Vercel 대시보드에서 환경 변수 설정
```

**Vercel 환경 변수:**
- `NEXT_PUBLIC_API_URL`: 백엔드 API URL
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: WalletConnect Project ID
- `NEXT_PUBLIC_KLAYTN_CHAIN_ID`: 클레이튼 체인 ID
- `NEXT_PUBLIC_KLAYTN_RPC_URL`: 클레이튼 RPC URL

### 2. 백엔드 배포 (Railway)

```bash
# Railway CLI 설치
npm i -g @railway/cli

# Railway 로그인
railway login

# 백엔드 배포
cd stable-back
railway up

# Railway 대시보드에서 환경 변수 설정
```

**Railway 환경 변수:**
- 로컬 URL을 제외한 `stable-back/.env`의 모든 변수

### 3. 데이터베이스 설정 (Supabase)

1. Supabase에서 프로덕션 데이터베이스 생성
2. Railway에서 `DATABASE_URL` 업데이트
3. 마이그레이션 실행:

```bash
# 프로덕션 데이터베이스에 연결
railway run npx prisma db push
```

### 4. Redis 설정 (Upstash)

1. [upstash.com](https://upstash.com)에서 Redis 데이터베이스 생성
2. 연결 URL 가져오기
3. Railway에서 `REDIS_URL` 업데이트

### 5. 스마트 컨트랙트 배포

```bash
cd stable-contract

# 메인넷 배포
npm run deploy:mainnet
npm run deploy:klaytn

# 컨트랙트 검증
npm run verify:mainnet
npm run verify:klaytn
```

### 6. 도메인 구성

1. **프론트엔드**: Vercel에서 사용자 정의 도메인 구성
2. **백엔드**: Railway에서 사용자 정의 도메인 구성
3. **CORS**: 프로덕션 도메인으로 `ALLOWED_ORIGINS` 업데이트

## 모니터링 설정

### 1. 에러 추적 (Sentry)

```bash
# Sentry 설치
npm install @sentry/nextjs @sentry/node
```

#### 프론트엔드 설정 (stable-front/sentry.client.config.js)
```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### 백엔드 설정 (stable-back/src/monitoring/sentry.ts)
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### 2. 가동시간 모니터링 (UptimeRobot)

1. [uptimerobot.com](https://uptimerobot.com)에서 계정 생성
2. 다음에 대한 모니터 추가:
   - 프론트엔드: `https://yourdomain.com`
   - 백엔드 API: `https://api.yourdomain.com/api/health`
3. 이메일/SMS 알림 설정

### 3. 로깅 (Pino + Logtail)

```bash
# logtail 설치
npm install @logtail/node
```

#### 백엔드에서 구성
```typescript
import { Logtail } from '@logtail/node';

const logtail = new Logtail('YOUR_LOGTAIL_TOKEN');
```

### 4. 분석 (Google Analytics)

```bash
# 프론트엔드에 추가
npm install gtag
```

#### stable-front/src/lib/gtag.ts에서 구성
```typescript
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;
```

## 테스트 실행

### 1. 단위 테스트

```bash
# 백엔드 테스트
cd stable-back
npm run test:unit

# 프론트엔드 테스트
cd stable-front
npm run test

# 스마트 컨트랙트 테스트
cd stable-contract
npm run test
```

### 2. 통합 테스트

```bash
# 백엔드 통합 테스트
cd stable-back
npm run test:integration
```

### 3. E2E 테스트

```bash
# 프론트엔드 E2E 테스트
cd stable-front
npm run test:e2e
```

### 4. 전체 테스트 실행

```bash
# 루트에서 모든 테스트 실행
npm run test
```

## 문제 해결

### 일반적인 문제

#### 1. 데이터베이스 연결 오류

```bash
# 데이터베이스 상태 확인
docker ps

# 연결 문자열 확인
echo $DATABASE_URL

# 연결 테스트
npx prisma db pull
```

#### 2. API 키 문제

```bash
# 0x API 테스트
curl -H "0x-api-key: YOUR_KEY" \
  "https://api.0x.org/swap/v1/quote?sellToken=USDC&buyToken=DAI&sellAmount=1000000"

# 1inch API 테스트
curl "https://api.1inch.io/v5.0/1/quote?fromTokenAddress=0xA0b86a33E6441b8c4C8C0E4b8c4C8C0E4b8c4C8C0&toTokenAddress=0x6B175474E89094C44Da98b954EedeAC495271d0F&amount=1000000"
```

#### 3. RPC 연결 문제

```bash
# RPC 엔드포인트 테스트
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  YOUR_RPC_URL
```

#### 4. 클레이튼 RPC 문제

```bash
# 클레이튼 RPC 테스트
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"klay_blockNumber","params":[],"id":1}' \
  https://public-node-api.klaytnapi.com/v1/cypress
```

#### 5. 프론트엔드 빌드 문제

```bash
# Next.js 캐시 지우기
rm -rf stable-front/.next

# 의존성 재설치
cd stable-front
rm -rf node_modules package-lock.json
npm install
```

#### 6. TypeScript 오류

```bash
# 타입 오류 확인
npm run type-check

# 공통 패키지 재생성
cd packages/shared
npm run build
```

### KRW 특화 문제 해결

#### 1. KRW 스테이블코인 인식 문제

```bash
# KRW 스테이블코인 목록 확인
curl http://localhost:3001/api/risk/whitelist

# 특정 KRW 스테이블코인 정보 확인
curl http://localhost:3001/api/risk/whitelist | jq '.[] | select(.pegCurrency == "KRW")'
```

#### 2. 디페그 감지 문제

```bash
# 디페그 상태 확인
curl -X POST http://localhost:3001/api/risk/check-depeg \
  -H "Content-Type: application/json" \
  -d '{"tokens": ["0x6270B58BE569a7c0b8f47594F191631Ae5b2C86C"]}'
```

#### 3. KRW 최적화 문제

```bash
# KRW 견적 테스트
curl -X POST http://localhost:3001/api/quote/krw \
  -H "Content-Type: application/json" \
  -d '{
    "tokenIn": "0x6270B58BE569a7c0b8f47594F191631Ae5b2C86C",
    "tokenOut": "0xceE8FAF64bE97aF5a7016412E8a34b4932325Ee7",
    "amountIn": "1000000"
  }'
```

### 성능 최적화

#### 1. 데이터베이스 최적화

```sql
-- 일반적인 쿼리를 위한 인덱스 추가
CREATE INDEX idx_quotes_created_at ON quotes(created_at);
CREATE INDEX idx_transactions_user_id ON transactions(user_address);
CREATE INDEX idx_risk_assessments_token ON risk_assessments(token_address);
CREATE INDEX idx_krw_quotes_expires_at ON krw_quotes(expires_at);
```

#### 2. Redis 최적화

```bash
# 캐싱을 위한 Redis 구성
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

#### 3. API 속도 제한

```bash
# 백엔드에서 속도 제한 조정
RATE_LIMIT_MAX=200
RATE_LIMIT_WINDOW=60000
```

### 보안 체크리스트

- [ ] 모든 API 키가 환경 변수에 저장됨
- [ ] 데이터베이스 자격 증명이 안전함
- [ ] CORS가 올바르게 구성됨
- [ ] 속도 제한이 활성화됨
- [ ] 입력 검증이 구현됨
- [ ] 오류 메시지가 민감한 정보를 누출하지 않음
- [ ] 프로덕션에서 HTTPS가 활성화됨
- [ ] 보안 헤더가 구성됨
- [ ] KRW 스테이블코인 화이트리스트가 구성됨
- [ ] 디페그 임계값이 적절히 설정됨

### 백업 전략

#### 1. 데이터베이스 백업

```bash
# 자동 백업 스크립트
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://xstables-backups/
rm backup_$DATE.sql
```

#### 2. 환경 설정 백업

```bash
# 환경 변수 내보내기
env | grep -E "(API_KEY|SECRET|TOKEN)" > env_backup.txt
```

#### 3. 코드 백업

```bash
# 정기적인 git 커밋
git add .
git commit -m "Backup: $(date)"
git push origin main
```

## 유지보수

### 일일 작업

- [ ] 오류 로그 확인
- [ ] API 응답 시간 모니터링
- [ ] 견적 정확도 검증
- [ ] 디페그 알림 확인
- [ ] KRW 스테이블코인 상태 확인

### 주간 작업

- [ ] 파트너 분석 검토
- [ ] 토큰 화이트리스트 업데이트
- [ ] 보안 알림 확인
- [ ] 성능 메트릭 검토
- [ ] KRW 최적화 성능 분석

### 월간 작업

- [ ] 의존성 업데이트
- [ ] 데이터베이스 검토 및 최적화
- [ ] 보안 감사
- [ ] 백업 검증
- [ ] KRW 시장 동향 분석

이 설정 가이드는 KRW 스테이블코인 특화 시스템을 위한 포괄적인 설정 지침을 제공하며, 개발부터 프로덕션 배포까지의 전체 과정을 다룹니다.