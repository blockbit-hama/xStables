# xStables 실행 가이드

## 🚀 빠른 시작

### 1. 모든 서비스 한번에 실행

가장 간단한 방법으로 모든 서비스를 동시에 실행할 수 있습니다:

```bash
./start-all.sh
```

이 스크립트는 다음을 자동으로 수행합니다:
- ✅ 포트 5200, 5201 사용 가능 여부 확인
- ✅ 필요한 의존성 자동 설치
- ✅ Prisma 클라이언트 자동 생성
- ✅ 백엔드 서버 시작 (포트 5201)
- ✅ 프론트엔드 서버 시작 (포트 5200)
- ✅ 환경 변수 자동 설정

### 2. 서비스 접속

스크립트 실행 후 다음 URL로 접속할 수 있습니다:

- **프론트엔드**: http://localhost:5200
- **백엔드 API**: http://localhost:5201

### 3. 서비스 중지

터미널에서 `Ctrl+C`를 누르면 모든 서비스가 자동으로 중지됩니다.

## 📋 사전 요구사항

### 필수 소프트웨어
- **Node.js**: 18.0.0 이상
- **npm**: 8.0.0 이상
- **PostgreSQL**: 14.0 이상
- **Git**: 최신 버전

### 권장 소프트웨어
- **Docker**: 컨테이너 실행용
- **VS Code**: 개발 환경
- **Postman**: API 테스트용

## 🔧 상세 설치 가이드

### 1. Node.js 설치

#### macOS (Homebrew)
```bash
brew install node@18
```

#### Ubuntu/Debian
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Windows
[Node.js 공식 웹사이트](https://nodejs.org/)에서 LTS 버전 다운로드

### 2. PostgreSQL 설치

#### macOS (Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
[PostgreSQL 공식 웹사이트](https://www.postgresql.org/download/windows/)에서 다운로드

### 3. 데이터베이스 설정

```bash
# PostgreSQL에 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE xstables;

# 사용자 생성 (선택사항)
CREATE USER xstables_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE xstables TO xstables_user;

# 종료
\q
```

## 🛠 개별 서비스 실행

### 백엔드만 실행

```bash
# 백엔드 디렉토리로 이동
cd back

# 의존성 설치
npm install

# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션 (최초 실행 시)
npx prisma migrate dev

# 개발 서버 시작
npm run start:dev
```

백엔드 서버가 http://localhost:5201 에서 실행됩니다.

### 프론트엔드만 실행

```bash
# 프론트엔드 디렉토리로 이동
cd front

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

프론트엔드 서버가 http://localhost:5200 에서 실행됩니다.

### 스마트 컨트랙트 실행

```bash
# 컨트랙트 디렉토리로 이동
cd contract

# 의존성 설치
npm install

# 컨트랙트 컴파일
npm run compile

# 테스트 실행
npm test

# 로컬 하드햇 노드 시작
npm run dev
```

## 🔑 환경 변수 설정

### 백엔드 환경 변수 (.env)

```bash
# back/.env 파일 생성
cat > back/.env << 'ENVEOF'
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/xstables?schema=public"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=development
PORT=5201

# Blockchain Configuration
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-project-id
BSC_RPC_URL=https://bsc-dataseed.binance.org/
POLYGON_RPC_URL=https://polygon-rpc.com/

# Deployer Private Key (for testing only)
DEPLOYER_PRIVATE_KEY=your-private-key-here
ENVEOF
```

### 프론트엔드 환경 변수 (.env.local)

```bash
# front/.env.local 파일 생성
cat > front/.env.local << 'ENVEOF'
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5201

# Application Configuration
PORT=5200
ENVEOF
```

## 🐳 Docker를 사용한 실행

### Docker Compose 파일 생성

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: xstables
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./back
    ports:
      - "5201:5201"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/xstables?schema=public
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./front
    ports:
      - "5200:5200"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:5201
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Docker로 실행

```bash
# 모든 서비스 빌드 및 실행
docker-compose up --build

# 백그라운드에서 실행
docker-compose up -d

# 서비스 중지
docker-compose down
```

## 🔍 문제 해결

### 일반적인 문제들

#### 1. 포트가 이미 사용 중인 경우

```bash
# 포트 사용 중인 프로세스 확인
lsof -i :5200
lsof -i :5201

# 프로세스 종료
kill -9 <PID>
```

#### 2. 데이터베이스 연결 오류

```bash
# PostgreSQL 서비스 상태 확인
brew services list | grep postgresql

# PostgreSQL 재시작
brew services restart postgresql@14

# 연결 테스트
psql -U postgres -d xstables -c "SELECT 1;"
```

#### 3. Prisma 관련 오류

```bash
# Prisma 클라이언트 재생성
cd back
npx prisma generate

# 데이터베이스 스키마 재생성
npx prisma migrate reset
npx prisma migrate dev
```

#### 4. Node.js 버전 문제

```bash
# Node.js 버전 확인
node --version

# nvm을 사용한 버전 관리
nvm install 18
nvm use 18
```

### 로그 확인

#### 백엔드 로그
```bash
cd back
npm run start:dev
# 터미널에서 실시간 로그 확인
```

#### 프론트엔드 로그
```bash
cd front
npm run dev
# 터미널에서 실시간 로그 확인
```

## 📊 성능 모니터링

### 백엔드 성능 확인

```bash
# API 응답 시간 테스트
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5201/auth/profile
```

### 데이터베이스 성능 확인

```bash
# PostgreSQL에 접속하여 쿼리 성능 확인
psql -U postgres -d xstables

# 활성 연결 확인
SELECT * FROM pg_stat_activity;

# 느린 쿼리 확인
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## 🧪 테스트 실행

### 백엔드 테스트

```bash
cd back

# 단위 테스트 실행
npm test

# 테스트 커버리지 확인
npm run test:cov

# E2E 테스트 실행
npm run test:e2e
```

### 프론트엔드 테스트

```bash
cd front

# 단위 테스트 실행
npm test

# 테스트 커버리지 확인
npm run test:coverage

# E2E 테스트 실행
npm run test:e2e
```

### 스마트 컨트랙트 테스트

```bash
cd contract

# 단위 테스트 실행
npm test

# 가스 사용량 확인
npm run test -- --gas-report
```

## 📝 개발 워크플로우

### 1. 개발 시작

```bash
# 저장소 클론
git clone <repository-url>
cd xStables

# 모든 서비스 실행
./start-all.sh
```

### 2. 코드 수정

- **백엔드**: `back/src/` 디렉토리에서 수정
- **프론트엔드**: `front/src/` 디렉토리에서 수정
- **스마트 컨트랙트**: `contract/contracts/` 디렉토리에서 수정

### 3. 변경사항 확인

- 브라우저에서 http://localhost:5200 접속
- API 테스트는 http://localhost:5201 에서 확인

### 4. 커밋 및 푸시

```bash
# 변경사항 스테이징
git add .

# 커밋
git commit -m "feat: 새로운 기능 추가"

# 푸시
git push origin main
```

## 🚀 프로덕션 배포

### 1. 빌드

```bash
# 백엔드 빌드
cd back
npm run build

# 프론트엔드 빌드
cd front
npm run build
```

### 2. 환경 변수 설정

프로덕션 환경에 맞게 환경 변수를 수정:

```bash
# 프로덕션 데이터베이스 URL
DATABASE_URL="postgresql://user:password@prod-db:5432/xstables"

# 강력한 JWT 시크릿
JWT_SECRET="your-very-secure-jwt-secret-key"

# 프로덕션 API URL
NEXT_PUBLIC_API_URL="https://api.xstables.com"
```

### 3. 서비스 시작

```bash
# 백엔드 프로덕션 모드
cd back
npm run start:prod

# 프론트엔드 프로덕션 모드
cd front
npm run start
```

## 📞 지원 및 문의

### 문제 발생 시

1. **로그 확인**: 위의 로그 확인 섹션 참조
2. **GitHub Issues**: 프로젝트 저장소에 이슈 생성
3. **문서 확인**: 각 문서의 문제 해결 섹션 참조

### 추가 도움

- **공식 문서**: [NestJS](https://nestjs.com/), [Next.js](https://nextjs.org/), [Prisma](https://www.prisma.io/)
- **커뮤니티**: 각 기술의 공식 커뮤니티 참여
- **스택 오버플로우**: 기술적 문제 해결

---

이 가이드를 따라하면 xStables 플랫폼을 성공적으로 실행할 수 있습니다. 문제가 발생하면 위의 문제 해결 섹션을 참조하거나 이슈를 생성해 주세요.
