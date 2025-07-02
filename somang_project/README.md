# 🚀 User App (프로젝트 이름)

> 이 프로젝트는 [간단한 한 줄 설명]을 위한 웹 애플리케이션입니다.

## 📖 프로젝트 소개 (Project Introduction)

이곳에 프로젝트에 대한 상세한 설명을 작성합니다. 예를 들어, 어떤 사용자를 위한 것이며, 어떤 문제를 해결하는지, 주요 목표는 무엇인지 등을 기술합니다. 스크린샷이나 GIF를 추가하면 이해도를 높일 수 있습니다.

## ✨ 주요 기능 (Key Features)

- **회원가입 및 로그인**: 사용자는 이메일 또는 소셜 로그인을 통해 계정을 만들고 접속할 수 있습니다.
    
- **상품 목록 조회**: 다양한 상품을 카테고리별로 필터링하고 검색할 수 있습니다.
    
- **장바구니 기능**: 원하는 상품을 장바구니에 담고 수량을 조절할 수 있습니다.
    
- **결제 시스템 연동**: 실제 결제가 가능한 PG사 모듈이 연동되어 있습니다.
    

## 🛠️ 기술 스택 (Tech Stack)

|구분|기술|
|---|---|
|**Framework**|Next.js 14, React 18|
|**Language**|TypeScript|
|**Styling**|Tailwind CSS|
|**State Management**|Zustand / Recoil|
|**Deployment**|Docker, AWS EC2, Nginx|
|**Package Manager**|npm|

## 🚀 시작하기 (Getting Started)

### 전제 조건 (Prerequisites)

- [Node.js](https://nodejs.org/en/ "null") (v22.17.0 이상 권장)
    
- [Docker](https://www.docker.com/products/docker-desktop/ "null")
    

### 설치 및 실행 (Installation & Running)

1. **저장소 복제 (Clone the repository)**
    
    ```
    git clone https://github.com/your-username/user-app.git
    cd user-app
    ```
    
2. **의존성 설치 (Install dependencies)**
    
    ```
    npm install
    ```
    
3. **환경 변수 설정 (Set up environment variables)** 프로젝트 루트에 `.env.local` 파일을 생성하고 아래 내용을 참고하여 변수를 입력합니다.
    
    ```
    # .env.example 파일을 참고하여 필요한 환경 변수를 설정하세요.
    NEXT_PUBLIC_API_URL=http://localhost:8080/api
    DATABASE_URL="your_database_connection_string"
    ```
    
4. **개발 서버 실행 (Run the development server)**
    
    ```
    npm run dev
    ```
    
5. **브라우저에서 확인** 웹 브라우저를 열고 `http://localhost:3000` 으로 접속하세요.
    

### Docker로 실행하기

1. **Docker 이미지 빌드 및 컨테이너 실행**
    
    ```
    # 개발 환경
    docker-compose up dev --build
    
    # 프로덕션 환경
    docker-compose up prod --build
    ```
    

## 📁 폴더 구조 (Folder Structure)

```
.
├── .next/         # Next.js 빌드 결과물
├── node_modules/  # 의존성 모듈
├── public/        # 정적 파일 (이미지, 폰트 등)
├── src/
│   ├── app/       # App 라우터 페이지
│   ├── components/  # 공통 컴포넌트
│   ├── lib/       # 유틸리티, 헬퍼 함수
│   ├── store/     # 상태 관리 (Zustand, Recoil)
│   └── styles/    # 전역 스타일
├── .env.local     # 환경 변수
├── Dockerfile     # Docker 이미지 설정
├── docker-compose.yml # Docker 실행 설정
├── package.json   # 프로젝트 정보 및 의존성
└── README.md      # 프로젝트 설명서
```