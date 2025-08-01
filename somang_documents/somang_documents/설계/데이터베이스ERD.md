## T-Bridge 데이터베이스 ERD (Entity-Relationship Diagram)

본 문서는 `데이터베이스모델링.md`에 정의된 DDL 스키마를 바탕으로 T-Bridge 시스템의 데이터베이스 구조를 시각화한 ERD를 제공합니다. 각 테이블(엔티티)과 그들 간의 관계를 명확히 표현하여 데이터 구조에 대한 직관적인 이해를 돕습니다.

### Mermaid ERD

```mermaid
erDiagram
    "auth.users" {
        uuid id PK
        string email
    }

    profiles {
        uuid id PK "FK to auth.users.id"
        text role
        text name
        text phone_number
        timestamptz created_at
        timestamptz deleted_at
    }

    user_settings {
        uuid user_id PK, FK
        boolean chat_notification_enabled
        boolean promotion_notification_enabled
        timestamptz updated_at
    }

    stores {
        uuid id PK
        uuid owner_id FK
        text name
        text store_type
        text business_method
        text phone_number
        text business_registration_number "UK"
        text pre_approval_number
        text zip_code
        text base_address
        text detail_address
        geography location "Point, 4326"
        text description
        text profile_image_url
        text status "'pending', 'approved', etc."
        boolean is_certified
        numeric response_rate
        integer chat_room_count
        integer accepted_quote_count
        timestamptz created_at
        timestamptz deleted_at
    }

    store_verification_documents {
        uuid id PK
        uuid store_id FK
        text document_type
        text file_url
        text status
        timestamptz created_at
        timestamptz reviewed_at
        uuid reviewer_id FK
    }

    promotions {
        uuid id PK
        uuid store_id FK
        text title
        text description
        timestamptz start_date
        timestamptz end_date
        timestamptz created_at
    }

    quote_requests {
        uuid id PK
        uuid user_id FK
        text product_type
        jsonb request_details
        text status
        timestamptz created_at
        timestamptz deleted_at
    }

    quotes {
        uuid id PK
        uuid request_id FK
        uuid store_id FK
        jsonb quote_details
        text status
        timestamptz created_at
        timestamptz deleted_at
    }

    reviews {
        uuid id PK
        uuid store_id FK
        uuid user_id FK
        uuid quote_id FK "UNIQUE"
        smallint rating
        text comment
        boolean is_hidden
        timestamptz created_at
        timestamptz deleted_at
    }

    review_votes {
        uuid id PK
        uuid review_id FK
        uuid user_id FK
        text vote_type
        timestamptz created_at
    }

    favorites {
        uuid id PK
        uuid user_id FK
        uuid target_id
        text target_type
        timestamptz created_at
    }

    chat_rooms {
        uuid id PK
        uuid user_id FK
        uuid store_id FK
        uuid quote_id FK
        timestamptz created_at
    }

    chat_messages {
        uuid id PK
        uuid room_id FK
        uuid sender_id FK
        text content
        text message_type
        text attachment_url
        timestamptz created_at
    }

    notices {
        uuid id PK
        uuid admin_id FK
        text title
        text content
        boolean is_published
        timestamptz created_at
    }

    policies {
        integer id PK
        text policy_type
        text version
        text content
        date effective_date
        timestamptz created_at
    }

    policy_consents {
        uuid id PK
        uuid user_id FK
        integer policy_id FK
        timestamptz consent_date
    }

    support_tickets {
        uuid id PK
        uuid user_id FK
        text title
        text content
        text status
        timestamptz created_at
    }

    ticket_replies {
        uuid id PK
        uuid ticket_id FK
        uuid replier_id FK
        text content
        timestamptz created_at
    }
    
    audit_logs {
        uuid id PK
        uuid actor_id FK
        text action_type
        uuid target_id
        jsonb old_value
        jsonb new_value
        timestamptz created_at
    }

    devices {
        uuid id PK
        text manufacturer
        text device_name
        text device_code UK
        date release_date
        text[] colors
        integer[] storage_options
        text description
        integer ram_gb
        integer battery_mah
        numeric screen_size_inch
        text display_spec
        text cpu_spec
        text camera_spec
        text external_memory_support
        text mobile_payment
        text water_dust_resistance
        text fingerprint_sensor
        boolean wireless_charging_supported
        boolean factory_film_attached
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    internet_products {
        uuid id PK
        text product_name
        text carrier
        text product_type
        integer internet_speed_mbps
        integer tv_channel_count
        integer regular_price
        integer discounted_price
        integer contract_period_months
        integer installation_fee_weekday
        integer installation_fee_weekend
        text description
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    "auth.users" ||--o| profiles : "extends"
    profiles ||--|| user_settings : "has"
    profiles ||--o{ stores : "owns"
    profiles ||--o{ quote_requests : "creates"
    profiles ||--o{ reviews : "writes"
    profiles ||--o{ chat_rooms : "participates in"
    profiles ||--o{ chat_messages : "sends"
    profiles ||--o{ favorites : "creates"
    profiles ||--o{ support_tickets : "creates"
    profiles ||--o{ ticket_replies : "writes"
    profiles ||--o{ policy_consents : "agrees to"
    profiles ||--o{ review_votes : "votes on"
    profiles }o--|| store_verification_documents : "reviews"
    profiles ||--o{ audit_logs: "performs action"

    stores ||--o{ quotes : "submits"
    stores ||--o{ reviews : "receives"
    stores ||--o{ chat_rooms : "participates in"
    stores ||--o{ promotions : "creates"
    stores ||--o{ store_verification_documents : "has"

    quote_requests ||--o{ quotes : "has"
    quotes ||--|| reviews : "results in"
    quotes |o--o| chat_rooms : "initiates"
    chat_rooms ||--o{ chat_messages : "contains"
    reviews ||--o{ review_votes : "has"
    notices }o--|| profiles : "written by"
    policies ||--o{ policy_consents : "has"
    support_tickets ||--o{ ticket_replies : "has"
```

### 관계 설명 (Relationship Description)

1.  **auth.users 1:1 profiles**: Supabase의 기본 `users` 테이블은 `profiles` 테이블로 확장됩니다.
2.  **profiles 1:1 user_settings**: 하나의 `profile`은 하나의 `user_settings`를 가집니다.
3.  **profiles 1:N stores**: 하나의 `profile`('owner' 역할)은 여러 `store`를 소유할 수 있습니다.
4.  **stores 1:N store_verification_documents**: 하나의 `store`는 여러 `store_verification_document`를 가질 수 있습니다 (예: 사업자등록증, 통신판매업신고증).
5.  **stores 1:N promotions**: 하나의 `store`는 여러 `promotion`을 생성할 수 있습니다.
6.  **profiles 1:N quote_requests**: 하나의 `profile`('user' 역할)은 여러 `quote_request`를 생성할 수 있습니다.
7.  **quote_requests 1:N quotes**: 하나의 `quote_request`에 대해 여러 `store`가 `quote`를 제출할 수 있습니다.
8.  **stores 1:N quotes**: 하나의 `store`는 여러 `quote`를 제출할 수 있습니다.
9.  **quotes 1:1 reviews**: 하나의 성사된 `quote`에 대해서는 하나의 `review`만 작성될 수 있습니다.
10. **reviews 1:N review_votes**: 하나의 `review`는 여러 사용자로부터 `review_vote`(좋아요/싫어요)를 받을 수 있습니다.
11. **profiles 1:N favorites**: 하나의 `profile`은 여러 `favorite`(찜) 항목을 가질 수 있습니다.
12. **chat_rooms 1:N chat_messages**: 하나의 `chat_room`은 여러 `chat_message`를 포함합니다.
13. **notices, policies, support_tickets**: 관리자/사용자가 생성하는 독립적인 정보 테이블들과의 관계를 정의합니다.
14. **audit_logs**: 관리자 및 시스템의 주요 활동을 기록하며, `profiles` 테이블을 참조하여 행위자를 식별합니다.