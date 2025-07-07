## T-Bridge API 명세서 (MSA)

본 문서는 T-Bridge의 마이크로서비스 아키텍처를 구성하는 각 서비스의 주요 API 명세를 기술합니다.

---

### 1. User-App API (`user-db` 프로젝트)

- **Base URL**: `https://{user-project-ref}.supabase.co`
- **주요 엔드포인트**:
    - `POST /auth/v1/token`: 사용자 로그인
    - `POST /auth/v1/signup`: 사용자 회원가입
    - `GET /profiles`: 내 프로필 조회
    - `POST /quote_requests`: 신규 견적 요청 생성
    - `GET /rpc/get_master_data`: **(신규)** 견적 요청에 필요한 마스터 데이터(단말기, 인터넷 상품 목록) 조회. 이 함수는 내부적으로 `biz-db`의 데이터를 조회합니다.
    - `POST /favorites`: 관심 판매점 찜하기
    - `POST /policy_consents`: 약관 동의

### 2. Biz-App API (`biz-db` 프로젝트)

- **Base URL**: `https://{biz-project-ref}.supabase.co`
- **주요 엔드포인트**:
    - `POST /auth/v1/token`: 사업주 로그인
    - `POST /rpc/handle_biz_signup`: 사업주 회원가입
    - `GET /stores`: 내 상점 정보 조회
    - `POST /quotes`: 신규 견적 제출
    - `GET /devices`: 단말기 마스터 데이터 조회 (읽기 전용)
    - `POST /devices`: 단말기 마스터 데이터 생성 (관리자 전용)
    - `GET /internet_products`: 인터넷 상품 마스터 데이터 조회 (읽기 전용)
    - `POST /internet_products`: 인터넷 상품 마스터 데이터 생성 (관리자 전용)
    - `GET /notices`: 공지사항 목록 조회

### 3. Chatting-App API (`chat-db` 프로젝트)

- **Base URL**: `https://{chat-project-ref}.supabase.co`
- **주요 엔드포인트**:
    - `POST /rpc/create_chat_room`: 신규 채팅방 생성
    - `GET /chat_messages`: 특정 채팅방의 메시지 목록 조회
    - `POST /chat_messages`: 새 메시지 전송

### 4. Admin-App API

- `admin-app`은 자체 API를 가지지 않으며, 각 서비스(User, Biz, Chatting)의 API를 **Service Role Key**를 사용하여 직접 호출하여 데이터를 관리합니다.