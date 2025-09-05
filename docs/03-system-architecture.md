# xStables 시스템 아키텍처

## 🏗 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        xStables Platform                        │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)     │  Backend (NestJS)     │  Smart Contracts │
│  Port: 5200            │  Port: 5201           │  (Solidity)      │
│  ┌─────────────────┐   │  ┌─────────────────┐   │  ┌─────────────┐ │
│  │ Web Interface   │   │  │ REST API        │   │  │ ERC-20      │ │
│  │ - Dashboard     │   │  │ - Auth          │   │  │ Stablecoin  │ │
│  │ - Forms         │   │  │ - Users         │   │  │ - Mint/Burn │ │
│  │ - Wallet Connect│   │  │ - Stablecoins   │   │  │ - Pausable  │ │
│  └─────────────────┘   │  │ - Transactions  │   │  └─────────────┘ │
│                        │  └─────────────────┘   │                  │
│  ┌─────────────────┐   │  ┌─────────────────┐   │  ┌─────────────┐ │
│  │ Web3 Integration│   │  │ Database        │   │  │ Oracle      │ │
│  │ - Wagmi         │   │  │ - PostgreSQL    │   │  │ - Chainlink │ │
│  │ - Viem          │   │  │ - Prisma ORM    │   │  │ - Price Feed│ │
│  │ - RainbowKit    │   │  │ - Redis Cache   │   │  └─────────────┘ │
│  └─────────────────┘   │  └─────────────────┘   │                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 아키텍처 원칙

### 1. 마이크로서비스 지향
- **서비스 분리**: 각 기능별로 독립적인 서비스
- **API 기반 통신**: RESTful API를 통한 서비스 간 통신
- **독립적 배포**: 각 서비스의 독립적인 배포 및 확장

### 2. 보안 우선
- **다층 보안**: 프론트엔드, 백엔드, 블록체인 각 레이어별 보안
- **암호화**: 데이터 전송 및 저장 시 암호화
- **접근 제어**: 역할 기반 접근 제어 (RBAC)

### 3. 확장성 고려
- **수평적 확장**: 로드 밸런싱을 통한 서비스 확장
- **캐싱 전략**: Redis를 활용한 성능 최적화
- **데이터베이스 최적화**: 인덱싱 및 쿼리 최적화

## 🖥 프론트엔드 아키텍처

### 기술 스택
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Web3**: Wagmi + Viem + RainbowKit

### 컴포넌트 구조
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   │   ├── login/         # 로그인 페이지
│   │   └── register/      # 회원가입 페이지
│   ├── dashboard/         # 대시보드
│   │   ├── overview/      # 개요 페이지
│   │   ├── stablecoins/   # 스테이블코인 관리
│   │   └── profile/       # 프로필 관리
│   ├── admin/             # 관리자 페이지
│   └── layout.tsx         # 루트 레이아웃
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   ├── forms/            # 폼 컴포넌트
│   ├── charts/           # 차트 컴포넌트
│   └── web3/             # Web3 관련 컴포넌트
├── lib/                  # 유틸리티 및 설정
│   ├── api/              # API 클라이언트
│   ├── auth/             # 인증 관련
│   └── utils/            # 유틸리티 함수
└── types/                # TypeScript 타입 정의
```

### 상태 관리
- **서버 상태**: React Query를 통한 API 데이터 관리
- **클라이언트 상태**: React Context + useReducer
- **Web3 상태**: Wagmi hooks를 통한 블록체인 상태 관리

## 🔧 백엔드 아키텍처

### 기술 스택
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT + Passport.js
- **Blockchain**: Ethers.js

### 모듈 구조
```
src/
├── auth/                  # 인증 모듈
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── strategies/        # JWT 전략
├── user/                  # 사용자 관리 모듈
│   ├── user.controller.ts
│   ├── user.service.ts
│   └── user.module.ts
├── stablecoin/            # 스테이블코인 관리 모듈
│   ├── stablecoin.controller.ts
│   ├── stablecoin.service.ts
│   └── stablecoin.module.ts
├── blockchain/            # 블록체인 연동 모듈
│   ├── blockchain.service.ts
│   └── blockchain.module.ts
├── prisma/                # Prisma 설정
│   ├── prisma.service.ts
│   └── prisma.module.ts
└── common/                # 공통 모듈
    ├── guards/            # 가드
    ├── decorators/        # 데코레이터
    └── filters/           # 예외 필터
```

### API 설계
- **RESTful API**: 표준 HTTP 메서드 사용
- **버전 관리**: `/api/v1/` 경로를 통한 API 버전 관리
- **응답 형식**: 일관된 JSON 응답 형식
- **에러 처리**: 표준화된 에러 응답

## 🗄 데이터베이스 아키텍처

### Prisma 스키마
```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  password        String
  role            UserRole  @default(USER)
  status          UserStatus @default(PENDING)
  // ... 기타 필드
  
  stablecoins     Stablecoin[]
  transactions    Transaction[]
}

model Stablecoin {
  id              String           @id @default(uuid())
  name            String
  symbol          String
  contractAddress String
  status          StablecoinStatus @default(PENDING)
  // ... 기타 필드
  
  owner           User         @relation(fields: [ownerId], references: [id])
  transactions    Transaction[]
  reserves        Reserve[]
}

model Transaction {
  id            String            @id @default(uuid())
  txHash        String
  type          TransactionType
  status        TransactionStatus @default(PENDING)
  // ... 기타 필드
  
  user          User        @relation(fields: [userId], references: [id])
  stablecoin    Stablecoin  @relation(fields: [stablecoinId], references: [id])
}

model Reserve {
  id              String        @id @default(uuid())
  name            String
  type            ReserveType
  amount          Decimal       @db.Decimal(20, 8)
  // ... 기타 필드
  
  stablecoin      Stablecoin    @relation(fields: [stablecoinId], references: [id])
}
```

### 데이터베이스 최적화
- **인덱싱**: 자주 조회되는 필드에 인덱스 설정
- **정규화**: 데이터 중복 최소화
- **파티셔닝**: 대용량 테이블 분할 고려
- **백업**: 정기적인 데이터베이스 백업

## ⛓ 블록체인 아키텍처

### 스마트 컨트랙트 구조
```solidity
contract Stablecoin is ERC20, Ownable, Pausable, ReentrancyGuard {
    // 상태 변수
    mapping(address => bool) public minters;
    mapping(address => bool) public burners;
    
    // 이벤트
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    
    // 함수
    function mint(address to, uint256 amount) external onlyMinter;
    function burn(address from, uint256 amount) external onlyBurner;
    function addMinter(address account) external onlyOwner;
    function removeMinter(address account) external onlyOwner;
}
```

### 블록체인 연동
- **다중 네트워크**: 이더리움, BSC, 폴리곤 등 지원
- **오라클 연동**: Chainlink를 통한 실시간 가격 피드
- **트랜잭션 모니터링**: 실시간 트랜잭션 상태 추적
- **가스 최적화**: 효율적인 가스 사용을 위한 최적화

## 🔐 보안 아키텍처

### 다층 보안 구조
```
┌─────────────────────────────────────────────────┐
│                Security Layers                  │
├─────────────────────────────────────────────────┤
│  Layer 1: Network Security                      │
│  - DDoS Protection                              │
│  - WAF (Web Application Firewall)               │
│  - SSL/TLS Encryption                           │
├─────────────────────────────────────────────────┤
│  Layer 2: Application Security                  │
│  - JWT Authentication                           │
│  - Role-based Access Control (RBAC)             │
│  - Input Validation & Sanitization              │
├─────────────────────────────────────────────────┤
│  Layer 3: Data Security                         │
│  - Database Encryption                          │
│  - Password Hashing (bcrypt)                    │
│  - Sensitive Data Masking                       │
├─────────────────────────────────────────────────┤
│  Layer 4: Smart Contract Security               │
│  - Multi-signature Wallets                      │
│  - Reentrancy Protection                        │
│  - Access Control Modifiers                     │
└─────────────────────────────────────────────────┘
```

### 인증 및 인가
- **JWT 토큰**: 상태 비저장 인증
- **토큰 갱신**: 자동 토큰 갱신 메커니즘
- **권한 관리**: 세분화된 권한 체계
- **세션 관리**: 안전한 세션 관리

## 📊 모니터링 및 로깅

### 모니터링 스택
- **Application Monitoring**: Grafana + Prometheus
- **Log Management**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Error Tracking**: Sentry
- **Performance Monitoring**: New Relic 또는 DataDog

### 로깅 전략
- **구조화된 로깅**: JSON 형식의 로그
- **로그 레벨**: DEBUG, INFO, WARN, ERROR
- **중앙 집중식 로깅**: 모든 서비스의 로그 중앙 수집
- **로그 보존**: 규정 준수를 위한 로그 보존 정책

## 🚀 배포 아키텍처

### 컨테이너화
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5201
CMD ["npm", "run", "start:prod"]
```

### 배포 전략
- **Blue-Green 배포**: 무중단 배포
- **Canary 배포**: 점진적 배포
- **롤백 전략**: 문제 발생 시 빠른 롤백
- **헬스체크**: 서비스 상태 모니터링

### 인프라 구성
```
┌─────────────────────────────────────────────────┐
│                Production Environment           │
├─────────────────────────────────────────────────┤
│  Load Balancer (Nginx/HAProxy)                  │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │ Frontend        │  │ Backend         │      │
│  │ (Next.js)       │  │ (NestJS)        │      │
│  │ - Static Files  │  │ - API Server    │      │
│  │ - CDN           │  │ - WebSocket     │      │
│  └─────────────────┘  └─────────────────┘      │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │ Database        │  │ Cache           │      │
│  │ (PostgreSQL)    │  │ (Redis)         │      │
│  │ - Master/Slave  │  │ - Cluster       │      │
│  │ - Backup        │  │ - Persistence   │      │
│  └─────────────────┘  └─────────────────┘      │
└─────────────────────────────────────────────────┘
```

## 🔄 CI/CD 파이프라인

### GitHub Actions 워크플로우
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker images
        run: docker build -t xstables-backend .
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: kubectl apply -f k8s/
```

## 📈 성능 최적화

### 백엔드 최적화
- **데이터베이스 쿼리 최적화**: 인덱스 활용 및 쿼리 튜닝
- **캐싱 전략**: Redis를 활용한 응답 캐싱
- **API 응답 최적화**: 불필요한 데이터 제거
- **연결 풀링**: 데이터베이스 연결 풀 최적화

### 프론트엔드 최적화
- **코드 스플리팅**: 페이지별 번들 분할
- **이미지 최적화**: WebP 형식 및 지연 로딩
- **캐싱 전략**: 브라우저 캐싱 및 CDN 활용
- **번들 최적화**: Tree shaking 및 압축

## 🔧 개발 환경

### 로컬 개발 환경
- **Docker Compose**: 모든 서비스 통합 실행
- **Hot Reload**: 개발 중 자동 재시작
- **환경 변수**: 개발/스테이징/프로덕션 환경 분리
- **데이터베이스**: 로컬 PostgreSQL 또는 Docker 컨테이너

### 테스트 환경
- **단위 테스트**: Jest를 활용한 함수/컴포넌트 테스트
- **통합 테스트**: API 엔드포인트 테스트
- **E2E 테스트**: Playwright를 활용한 전체 플로우 테스트
- **성능 테스트**: 부하 테스트 및 성능 측정

---

이 아키텍처는 확장성, 보안성, 유지보수성을 고려하여 설계되었으며, 비즈니스 요구사항의 변화에 유연하게 대응할 수 있도록 구성되었습니다.
