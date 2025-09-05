# xStables - 스테이블코인 발행 대행사 서비스

xStables는 기업과 기관이 자체 스테이블코인을 발행할 수 있도록 종합적인 솔루션을 제공하는 플랫폼입니다.

## 🚀 빠른 시작

### 모든 서비스 한번에 실행

```bash
./start-all.sh
```

이 스크립트는 다음을 자동으로 수행합니다:
- 포트 5200, 5201 사용 가능 여부 확인
- 백엔드 서버 시작 (포트 5201)
- 프론트엔드 서버 시작 (포트 5200)
- 필요한 의존성 자동 설치
- Prisma 클라이언트 자동 생성

### 서비스 접속

- **프론트엔드**: http://localhost:5200
- **백엔드 API**: http://localhost:5201

### 서비스 중지

터미널에서 `Ctrl+C`를 누르면 모든 서비스가 자동으로 중지됩니다.

## 📁 프로젝트 구조

```
xStables/
├── start-all.sh          # 모든 서비스 실행 스크립트
├── back/                 # 백엔드 (NestJS + Prisma)
│   ├── src/
│   │   ├── auth/         # 인증 모듈
│   │   ├── user/         # 사용자 관리 모듈
│   │   ├── prisma/       # Prisma 설정
│   │   └── ...
│   ├── prisma/           # 데이터베이스 스키마
│   └── .env              # 백엔드 환경 변수
├── front/                # 프론트엔드 (Next.js)
│   ├── src/
│   │   ├── app/          # Next.js App Router
│   │   ├── lib/          # 유틸리티 및 API 클라이언트
│   │   └── types/        # TypeScript 타입 정의
│   └── .env.local        # 프론트엔드 환경 변수
├── contract/             # 스마트 컨트랙트 (Solidity)
└── docs/                 # 프로젝트 문서
```

## 🛠 기술 스택

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL + Prisma
- **Authentication**: JWT
- **Blockchain**: Ethers.js

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Web3**: Wagmi + Viem + RainbowKit

### Smart Contracts
- **Language**: Solidity
- **Framework**: Hardhat
- **Libraries**: OpenZeppelin

## 🔧 개별 서비스 실행

### 백엔드만 실행
```bash
cd back
npm install
npm run start:dev
```

### 프론트엔드만 실행
```bash
cd front
npm install
npm run dev
```

## 📊 데이터베이스 설정

### PostgreSQL 설치 및 설정
```bash
# macOS (Homebrew)
brew install postgresql
brew services start postgresql

# 데이터베이스 생성
createdb xstables
```

### Prisma 마이그레이션
```bash
cd back
npx prisma migrate dev
npx prisma generate
```

## 🔑 환경 변수

### 백엔드 (.env)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/xstables?schema=public"
JWT_SECRET=your-super-secret-jwt-key
PORT=5201
```

### 프론트엔드 (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5201
PORT=5200
```

## 📝 API 문서

백엔드 서버가 실행되면 다음 엔드포인트를 사용할 수 있습니다:

- `POST /auth/register` - 사용자 등록
- `POST /auth/login` - 로그인
- `GET /auth/profile` - 프로필 조회
- `GET /users` - 사용자 목록 (관리자)
- `GET /users/stats` - 사용자 통계 (관리자)

## 🚧 개발 상태

- ✅ **백엔드**: Prisma 기반 API 서버 완성
- ✅ **스마트 컨트랙트**: ERC-20 스테이블코인 컨트랙트 완성
- 🚧 **프론트엔드**: 기본 구조 완성, UI 구현 진행 중

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.

---

**xStables** - 스테이블코인 발행의 새로운 표준
