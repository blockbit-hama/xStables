# xStables 배포 가이드

## 🚀 프로덕션 배포 체크리스트

### 1. 환경 변수 설정

#### Vercel (프론트엔드)
```bash
# API 설정
NEXT_PUBLIC_API_URL=https://xstables-api.railway.app
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# 분석
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

#### Railway (백엔드)
```bash
# 환경
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info

# 데이터베이스
DATABASE_URL=postgresql://user:pass@host:port/db

# Redis
REDIS_URL=redis://user:pass@host:port

# 외부 API
ZEROX_API_KEY=your_0x_api_key
ONEINCH_API_KEY=your_1inch_api_key

# RPC URLs
ETHEREUM_RPC=https://eth-mainnet.g.alchemy.com/v2/your_key
ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC=https://mainnet.optimism.io
POLYGON_RPC=https://polygon-rpc.com
KLAYTN_RPC=https://public-node-api.klaytnapi.com/v1/cypress

# CORS
ALLOWED_ORIGINS=https://xstables.vercel.app,https://www.xstables.com

# 모니터링
SENTRY_DSN=your_sentry_dsn
```

### 2. 데이터베이스 설정

#### Supabase PostgreSQL
```sql
-- 기본 테이블 생성
CREATE TABLE quotes (
  id SERIAL PRIMARY KEY,
  request_hash VARCHAR(64) UNIQUE,
  response JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42),
  from_token VARCHAR(42),
  to_token VARCHAR(42),
  amount_in VARCHAR(78),
  amount_out VARCHAR(78),
  total_cost_usd DECIMAL(18,6),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE partner_revenue (
  id SERIAL PRIMARY KEY,
  partner_id VARCHAR(64),
  transaction_id INTEGER,
  revenue_usd DECIMAL(18,6),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_quotes_created_at ON quotes(created_at);
CREATE INDEX idx_transactions_user_id ON transactions(user_address);
CREATE INDEX idx_risk_assessments_token ON risk_assessments(token_address);
```

### 3. Redis 설정 (Upstash)

```bash
# Redis 설정
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### 4. 스마트 컨트랙트 배포

#### 이더리움 메인넷
```bash
cd stable-contract
npx hardhat run scripts/deploy.ts --network mainnet
```

#### 클레이튼 메인넷
```bash
cd stable-contract
npx hardhat run scripts/deploy.ts --network klaytn
```

### 5. 도메인 설정

#### Vercel 도메인
1. Vercel 대시보드에서 도메인 추가
2. DNS 설정에서 CNAME 레코드 추가
3. SSL 인증서 자동 발급 확인

#### Railway 도메인
1. Railway 대시보드에서 도메인 추가
2. DNS 설정에서 CNAME 레코드 추가
3. SSL 인증서 자동 발급 확인

### 6. 모니터링 설정

#### Sentry
1. Sentry 프로젝트 생성
2. DSN을 환경 변수에 추가
3. 알림 규칙 설정

#### UptimeRobot
1. 프론트엔드 모니터링: `https://xstables.vercel.app`
2. 백엔드 모니터링: `https://xstables-api.railway.app/api/health`
3. 알림 설정 (이메일, 슬랙)

### 7. 보안 설정

#### API 키 관리
- 모든 API 키를 환경 변수로 관리
- 정기적인 키 로테이션
- 접근 권한 최소화

#### CORS 설정
```typescript
// 허용된 도메인만 설정
ALLOWED_ORIGINS=https://xstables.vercel.app,https://www.xstables.com
```

#### Rate Limiting
```typescript
// API 호출 제한
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

### 8. 백업 설정

#### 데이터베이스 백업
```bash
# 자동 백업 스크립트
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://xstables-backups/
rm backup_$DATE.sql
```

#### 환경 변수 백업
```bash
# Railway 환경 변수 백업
railway variables --json > env_backup_$(date +%Y%m%d).json
```

### 9. 성능 최적화

#### CDN 설정
- Vercel 자동 CDN 활용
- 이미지 최적화 활성화
- 정적 자산 캐싱

#### 데이터베이스 최적화
```sql
-- 쿼리 최적화를 위한 인덱스
CREATE INDEX CONCURRENTLY idx_transactions_created_at ON transactions(created_at);
CREATE INDEX CONCURRENTLY idx_quotes_expires_at ON quotes(expires_at);
```

### 10. 배포 후 검증

#### 기능 테스트
- [ ] 지갑 연결 테스트
- [ ] KRW 스테이블코인 스왑 테스트
- [ ] 수수료 계산 테스트
- [ ] 디페그 감지 테스트
- [ ] 파트너 API 테스트

#### 성능 테스트
- [ ] API 응답 시간 < 200ms
- [ ] 프론트엔드 로딩 시간 < 3초
- [ ] 데이터베이스 쿼리 최적화
- [ ] Redis 캐시 동작 확인

#### 보안 테스트
- [ ] CORS 설정 확인
- [ ] Rate limiting 동작 확인
- [ ] API 키 보안 확인
- [ ] HTTPS 강제 설정 확인

### 11. 모니터링 대시보드

#### 주요 메트릭
- API 응답 시간
- 에러율
- 거래량
- 수익
- 사용자 수
- 디페그 알림

#### 알림 설정
- 에러율 > 1% 시 알림
- 응답 시간 > 5초 시 알림
- 디페그 감지 시 즉시 알림
- 서비스 다운 시 알림

### 12. 롤백 계획

#### 긴급 롤백
```bash
# Vercel 롤백
vercel rollback

# Railway 롤백
railway rollback
```

#### 데이터 롤백
```bash
# 데이터베이스 롤백
psql $DATABASE_URL < backup_previous.sql
```

### 13. 운영 체크리스트

#### 일일 체크
- [ ] 에러 로그 확인
- [ ] API 응답 시간 모니터링
- [ ] 디페그 알림 확인
- [ ] 거래량 모니터링

#### 주간 체크
- [ ] 파트너 수익 정산
- [ ] 성능 메트릭 리뷰
- [ ] 보안 알림 확인
- [ ] 사용자 피드백 검토

#### 월간 체크
- [ ] 의존성 업데이트
- [ ] 데이터베이스 최적화
- [ ] 비용 분석
- [ ] 로드맵 업데이트

## 🎯 성공 지표

### 기술적 지표
- 가용성: 99.9% 이상
- 응답 시간: 95% < 200ms
- 에러율: < 0.1%
- 견적 정확도: > 99%

### 비즈니스 지표
- 월 거래량: $1M → $10M → $100M
- 사용자 수: 100 → 1K → 10K
- 파트너 수: 1 → 10 → 100
- 월 수익: $1K → $10K → $100K

### 운영 지표
- 개발 시간: 40시간/주 → 20시간/주
- 지원 티켓: < 5/주
- 시스템 장애: < 1/월
- 보안 이슈: 0/월

## 📞 지원 및 연락처

### 기술 지원
- 이메일: tech@xstables.com
- 슬랙: #xstables-support

### 비즈니스 문의
- 이메일: business@xstables.com
- 전화: +82-2-1234-5678

### 긴급 상황
- 24/7 모니터링: UptimeRobot
- 자동 알림: Slack, 이메일
- 긴급 연락처: +82-10-1234-5678