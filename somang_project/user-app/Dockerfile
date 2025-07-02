# =========================================
# 1. 개발 환경 스테이지 (Development Stage)
# =========================================
FROM node:22.17.0-alpine AS development

# 앱 디렉토리 설정
WORKDIR /app

# package.json과 lock 파일 먼저 복사하여 캐싱 활용
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 3000번 포트 개방
EXPOSE 3000

# 개발 서버 실행 명령어
CMD ["npm", "run", "dev"]


# =========================================
# 2. 빌드 스테이지 (Builder Stage)
# =========================================
FROM node:22.17.0-alpine AS builder

WORKDIR /app

COPY package*.json ./

# 프로덕션 빌드에 필요한 모든 의존성 설치
RUN npm install

COPY . .

# Next.js 앱 빌드
RUN npm run build


# =========================================
# 3. 프로덕션 스테이지 (Production Stage)
# =========================================
FROM node:22.17.0-alpine AS production

WORKDIR /app

# 프로덕션에 필요한 최소한의 의존성만 설치
COPY package*.json ./
RUN npm ci --only=production

# 빌드 스테이지에서 결과물 복사
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# .js 또는 .mjs 파일을 모두 처리하고, 파일이 없어도 오류가 발생하지 않도록 수정
COPY --from=builder /app/next.config.*js ./

# 3000번 포트 개방
EXPOSE 3000

# 프로덕션 서버 실행
CMD ["npm", "start"]
