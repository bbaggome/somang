# 기능 명세: 단말기 정보 관리

-   **기능 ID**: `FE-ADM-040`
-   **기능 Epic**: `관리자 기능`
-   **담당자/작성자**:
-   **작성일**: `2025-06-23`

## 1. 기능 개요
최고관리자가 시스템의 기준 정보가 되는 휴대폰 단말기(Device) 정보를 생성, 조회, 수정, 삭제(CRUD)하는 기능.
이곳에 등록된 단말기 정보는 사용자와 판매점이 견적을 요청하거나 등록할 때 모델 선택 목록 등으로 사용된다.

## 2. Actor
-   `최고관리자 (Admin)`

## 3. 전제 조건
-   관리자 계정으로 시스템에 로그인되어 있다.
-   관리자 페이지의 '단말기 정보 관리' 메뉴에 접근할 수 있다.

## 4. 기능 상세 (Sequence Diagram)

```mermaid
sequenceDiagram
    actor Admin
    participant AdminUI as 관리자 웹 UI
    participant SupabaseAPI as Supabase API (Edge Fns)
    participant DB as PostgreSQL DB (devices)

    Admin->>AdminUI: 단말기 정보 관리 메뉴 선택
    AdminUI->>SupabaseAPI: GET /devices (단말기 목록 요청)
    SupabaseAPI->>DB: SELECT * FROM devices;
    Note right of DB: RLS Policy 적용<br/>(읽기 권한 체크)
    DB-->>SupabaseAPI: 단말기 목록 반환
    SupabaseAPI-->>AdminUI: 목록 데이터 반환
    AdminUI-->>Admin: 등록된 단말기 목록 표시

    Admin->>AdminUI: '신규 등록' 버튼 클릭 및 정보 입력
    AdminUI->>SupabaseAPI: POST /devices (신규 단말기 정보)
    SupabaseAPI->>DB: INSERT INTO devices (...);
    Note right of DB: RLS Policy 적용<br/>(쓰기 권한 체크: admin 역할 확인)
    DB-->>SupabaseAPI: 생성 성공 응답
    SupabaseAPI-->>AdminUI: 성공 응답
    AdminUI-->>Admin: '등록 완료' 메시지 표시 및 목록 갱신
```

## 5. 성공 시나리오 (Postconditions)
1.  **생성(Create)**: 관리자가 입력한 단말기 정보(제조사, 모델명, 색상 등)가 `devices` 테이블에 성공적으로 저장된다.
2.  **조회(Read)**: `devices` 테이블에 저장된 단말기 정보 목록을 관리자 페이지에서 확인할 수 있다.
3.  **수정(Update)**: 기존 단말기 정보의 내용을 수정하고 저장할 수 있다.
4.  **삭제(Delete)**: 특정 단말기 정보를 목록에서 삭제할 수 있다. (Soft Delete: `deleted_at` 컬럼에 현재 시각 기록)

## 6. 예외 시나리오
-   필수 입력값(제조사, 기기명, 기기 코드) 누락 시, UI 단에서 유효성 검사 오류를 표시한다.
-   이미 등록된 '기기 코드'로 생성을 시도할 경우, 데이터베이스의 UNIQUE 제약 조건에 의해 실패하고 '중복된 기기 코드'라는 에러 메시지를 표시한다.
-   관리자가 아닌 사용자가 API를 통해 데이터 조작을 시도할 경우, RLS 정책에 의해 차단된다.