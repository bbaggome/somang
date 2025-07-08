## T-Bridge RESTful API 명세서 (OpenAPI 3.0)

본 문서는 T-Bridge 서비스의 주요 기능에 대한 RESTful API 명세서를 OpenAPI 3.0 사양에 따라 기술합니다.

### API 설계 원칙

T-Bridge의 백엔드는 Supabase(BaaS)를 기반으로 구축됩니다. 따라서, API 엔드포인트는 Supabase의 **PostgREST** 사양을 따릅니다. PostgREST는 데이터베이스 테이블과 뷰를 기반으로 RESTful API를 자동으로 생성하는 도구입니다.

-   **엔드포인트**: 테이블 이름이 곧 엔드포인트 경로가 됩니다. (예: `stores` 테이블 -> `/stores` 엔드포인트)
-   **인증**: 모든 요청(로그인/회원가입 제외)은 `Authorization` 헤더에 JWT(JSON Web Token)를 포함해야 합니다.
-   **인가**: 데이터 접근 권한은 API 레벨이 아닌, 데이터베이스의 RLS(행 수준 보안) 정책에 의해 제어됩니다.
-   **RPC**: 단순 CRUD를 넘어서는 복잡한 비즈니스 로직은 PostgreSQL 함수를 호출하는 `/rpc/{function_name}` 엔드포인트를 통해 실행됩니다.

---

### OpenAPI 3.0 명세 (YAML)

```yaml
openapi: 3.0.0
info:
  title: T-Bridge API
  version: 1.0.0
  description: T-Bridge 서비스의 공식 RESTful API 명세서입니다. Supabase PostgREST 및 GoTrue(Auth) 기반으로 설계되었습니다.

servers:
  - url: https://{your-project-ref}.supabase.co
    description: Supabase Production Environment

# ======================================================
#  Security & Components
# ======================================================
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    # ---------- Base Schemas ----------
    QuoteRequest:
      type: object
      properties:
        id: { type: string, format: uuid, readOnly: true }
        user_id: { type: string, format: uuid, readOnly: true }
        product_type: { type: string, enum: [mobile_phone, internet] }
        request_details: { type: object, description: "요청 상세 (예: { \"model\": \"iPhone 17\" })" }
        status: { type: string, enum: [open, closed, expired], readOnly: true }
        created_at: { type: string, format: date-time, readOnly: true }

    QuoteRequestInput: # POST 요청 시 사용할 스키마
      type: object
      required:
        - product_type
        - request_details
      properties:
        product_type: { type: string, enum: [mobile_phone, internet] }
        request_details: { type: object }
    
    Quote:
      type: object
      properties:
        id: { type: string, format: uuid, readOnly: true }
        request_id: { type: string, format: uuid }
        store_id: { type: string, format: uuid }
        quote_details: { type: object, description: "표준 견적 상세 (예: { \"price\": 850000, \"tco\": 2100000 })" }
        status: { type: string, enum: [sent, viewed, accepted, rejected], readOnly: true }
        created_at: { type: string, format: date-time, readOnly: true }

# ======================================================
#  Paths
# ======================================================
paths:
  # ---------- Auth (사용자 인증) ----------
  /auth/v1/token?grant_type=password:
    post:
      summary: 이메일/비밀번호 로그인
      tags: [Authentication]
      description: 이메일과 비밀번호로 사용자를 인증하고 JWT를 발급받습니다.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string, format: password }
      responses:
        '200':
          description: 로그인 성공. Access Token 및 Refresh Token 반환.
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token: { type: string }
                  refresh_token: { type: string }
        '400':
          description: 잘못된 요청 또는 로그인 정보 불일치

  # ---------- Quote Requests (견적 요청) ----------
  /quote_requests:
    get:
      summary: 내 견적 요청 목록 조회
      tags: [Quoting]
      security:
        - bearerAuth: []
      description: 현재 인증된 사용자가 생성한 모든 견적 요청 목록을 조회합니다. RLS 정책에 의해 자동으로 필터링됩니다.
      responses:
        '200':
          description: 견적 요청 목록 조회 성공
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/QuoteRequest'
        '401':
          description: 인증되지 않은 사용자

    post:
      summary: 신규 견적 요청 생성
      tags: [Quoting]
      security:
        - bearerAuth: []
      description: 새로운 휴대폰 또는 인터넷 견적 요청을 생성합니다.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/QuoteRequestInput'
      responses:
        '201':
          description: 견적 요청 생성 성공. 생성된 리소스 반환.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QuoteRequest'
        '401':
          description: 인증되지 않은 사용자

  # ---------- Quotes (견적 조회) ----------
  /quotes:
    get:
      summary: 특정 요청에 대한 견적 목록 조회
      tags: [Quoting]
      security:
        - bearerAuth: []
      description: 특정 `request_id`에 해당하는 모든 견적 목록을 조회합니다.
      parameters:
        - name: request_id
          in: query
          required: true
          schema:
            type: string
            format: uuid
          description: 조회할 견적 요청의 ID
      responses:
        '200':
          description: 견적 목록 조회 성공
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Quote'
        '401':
          description: 인증되지 않은 사용자
        '403':
          description: 해당 요청을 조회할 권한이 없음 (RLS 정책에 의해 차단)

  # ---------- RPC (견적 수락) ----------
  /rpc/accept_quote:
    post:
      summary: 특정 견적 수락
      tags: [Quoting]
      security:
        - bearerAuth: []
      description: 사용자가 특정 견적을 최종 수락합니다. 이 작업은 관련 레코드들의 상태를 트랜잭션으로 처리하는 DB 함수를 호출합니다.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [quote_id_to_accept]
              properties:
                quote_id_to_accept: { type: string, format: uuid }
      responses:
        '204':
          description: 견적 수락 처리 성공. 반환되는 콘텐츠 없음.
        '401':
          description: 인증되지 않은 사용자
        '403':
          description: 해당 견적을 수락할 권한이 없음
        '404':
          description: 존재하지 않는 견적 ID

```