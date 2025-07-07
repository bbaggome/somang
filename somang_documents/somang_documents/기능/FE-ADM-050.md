# 기능 명세: 인터넷 상품 관리

-   **기능 ID**: `FE-ADM-050`
-   **기능 Epic**: `관리자 기능`
-   **담당자/작성자**:
-   **작성일**: `2025-06-23`

## 1. 기능 개요
최고관리자가 플랫폼에서 제공하는 인터넷 및 TV 결합 상품의 기준 정보를 생성, 조회, 수정, 삭제(CRUD)하는 기능이다. 이곳에 등록된 상품 정보는 사용자가 '인터넷' 관련 견적을 요청할 때 기준이 되는 마스터 데이터로 활용된다.

## 2. 관련 서비스
-   **admin-app**: 인터넷 상품 정보 CRUD UI 제공
-   **biz-app (Supabase Project)**: **인터넷 상품 마스터 데이터의 실제 저장소 역할**
-   **user-app, biz-app**: `biz-app`의 DB에서 상품 정보를 읽어와 화면에 표시

## 3. 기능 상세 (Sequence Diagram)

```mermaid
sequenceDiagram
    actor Admin
    participant AdminApp as 관리자 앱
    participant BizAPI as Biz-App API
    participant BizDB as Biz Project DB

    Admin->>AdminApp: '인터넷 상품 관리' 메뉴 선택
    AdminApp->>BizAPI: GET /internet_products (상품 목록 요청)
    BizAPI->>BizDB: SELECT * FROM internet_products;
    BizDB-->>BizAPI: 인터넷 상품 목록 반환
    BizAPI-->>AdminApp: 목록 데이터 반환
    AdminApp-->>Admin: 등록된 인터넷 상품 목록 표시

    Admin->>AdminApp: '신규 상품 등록' 버튼 클릭 및 정보 입력
    AdminApp->>BizAPI: POST /internet_products (신규 상품 정보)
    BizAPI->>BizDB: INSERT INTO internet_products (...);
    BizDB-->>BizAPI: 생성 성공 응답
    BizAPI-->>AdminApp: 성공 응답
    AdminApp-->>Admin: '등록 완료' 메시지 표시 및 목록 갱신
```
