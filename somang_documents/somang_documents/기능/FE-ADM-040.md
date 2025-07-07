# 기능 명세: 단말기 정보 관리

-   **기능 ID**: `FE-ADM-040`
-   **기능 Epic**: `관리자 기능`
-   **담당자/작성자**:
-   **작성일**: `2025-06-23`

## 1. 기능 개요
최고관리자가 시스템의 기준 정보가 되는 휴대폰 단말기(Device) 정보를 생성, 조회, 수정, 삭제(CRUD)하는 기능. 이곳에 등록된 단말기 정보는 사용자와 판매점이 견적을 요청하거나 등록할 때 모델 선택 목록 등으로 사용된다.

## 2. 관련 서비스
-   **admin-app**: 단말기 정보 CRUD UI 제공
-   **biz-app (Supabase Project)**: **단말기 마스터 데이터의 실제 저장소 역할**
-   **user-app, biz-app**: `biz-app`의 DB에서 단말기 정보를 읽어와 화면에 표시

## 3. 기능 상세 (Sequence Diagram)

```mermaid
sequenceDiagram
    actor Admin
    participant AdminApp as 관리자 앱
    participant BizAPI as Biz-App API
    participant BizDB as Biz Project DB

    Admin->>AdminApp: 단말기 정보 관리 메뉴 선택
    AdminApp->>BizAPI: GET /devices (단말기 목록 요청)
    BizAPI->>BizDB: SELECT * FROM devices;
    BizDB-->>BizAPI: 단말기 목록 반환
    BizAPI-->>AdminApp: 목록 데이터 반환
    AdminApp-->>Admin: 등록된 단말기 목록 표시

    Admin->>AdminApp: '신규 등록' 버튼 클릭 및 정보 입력
    AdminApp->>BizAPI: POST /devices (신규 단말기 정보)
    BizAPI->>BizDB: INSERT INTO devices (...);
    BizDB-->>BizAPI: 생성 성공 응답
    BizAPI-->>AdminApp: 성공 응답
    AdminApp-->>Admin: '등록 완료' 메시지 표시 및 목록 갱신
```
