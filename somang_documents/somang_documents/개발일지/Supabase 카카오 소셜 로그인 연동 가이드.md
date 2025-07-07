
이 가이드는 Supabase와 Next.js를 사용하여 카카오 소셜 로그인을 구현하는 전체 과정을 안내합니다.

### 1단계: Supabase 데이터베이스 테이블 및 함수 설정

가장 먼저, 소셜 로그인으로 가입한 사용자의 추가 정보(예: 역할, 이름)를 저장할 `profiles` 테이블을 생성해야 합니다.

1. **Supabase 프로젝트 대시보드**로 이동합니다.
    
2. 왼쪽 메뉴에서 **SQL Editor**를 선택하고, **New query**를 클릭합니다.
    
3. 아래의 SQL 코드를 붙여넣고 **RUN** 버튼을 눌러 테이블을 생성합니다. 이 코드는 설계 문서에 정의된 `profiles` 테이블을 생성합니다.
    
    ```
    -- 1. profiles 테이블 생성
    CREATE TABLE public.profiles (
        id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'owner', 'admin')),
        name text,
        phone_number text,
        email text, -- 카카오에서 받은 이메일 저장
        avatar_url text, -- 카카오에서 받은 프로필 이미지 URL 저장
        created_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
    );
    
    -- 2. 테이블 및 컬럼에 대한 주석 추가
    COMMENT ON TABLE public.profiles IS '사용자의 역할 및 공통 프로필 정보를 관리합니다.';
    COMMENT ON COLUMN public.profiles.id IS '사용자 고유 ID. auth.users.id를 참조합니다.';
    COMMENT ON COLUMN public.profiles.role IS '사용자 역할: user, owner, admin';
    COMMENT ON COLUMN public.profiles.name IS '사용자 이름 또는 닉네임';
    COMMENT ON COLUMN public.profiles.phone_number IS '사용자 연락처';
    COMMENT ON COLUMN public.profiles.email IS '사용자 이메일 주소';
    COMMENT ON COLUMN public.profiles.avatar_url IS '사용자 프로필 이미지 URL';
    COMMENT ON COLUMN public.profiles.created_at IS '프로필 생성일시';
    COMMENT ON COLUMN public.profiles.deleted_at IS '프로필 소프트 삭제일시';
    
    -- 3. RLS(행 수준 보안) 활성화
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- 4. 본인 프로필만 조회/수정 가능하도록 정책 생성
    CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
    CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
    
    ```
    
4. 다음으로, 새로운 사용자가 가입할 때마다 위에서 만든 `profiles` 테이블에 해당 사용자의 정보를 자동으로 추가하는 함수(트리거)를 설정합니다. 이 과정은 소셜 로그인 시 필수적입니다. 다시 SQL Editor에서 아래 코드를 실행해주세요.
    
    ```
    -- 새로운 사용자가 생성될 때 profiles 테이블에 데이터를 추가하는 함수
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER SET search_path = public
    AS $$
    BEGIN
      INSERT INTO public.profiles (id, name, email, avatar_url)
      VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
      );
      RETURN NEW;
    END;
    $$;
    
    -- auth.users 테이블에 INSERT 이벤트가 발생할 때마다 위 함수를 실행하는 트리거 생성
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    ```
    

### 2단계: Supabase 카카오 인증 설정

1. **Supabase 프로젝트 대시보드**의 왼쪽 메뉴에서 **Authentication** > **Providers**로 이동합니다.
    
2. Providers 목록에서 **Kakao**를 찾아 활성화(Enable)합니다.
    
3. **Client ID**와 **Client Secret**을 입력하는 필드가 나타납니다. 이 정보는 [카카오 개발자 콘솔](https://developers.kakao.com/ "null")에서 얻을 수 있습니다.
    
4. 카카오 개발자 콘솔에서 애플리케이션을 만들고, **[제품 설정] > [카카오 로그인]** 메뉴에서 **Redirect URI**를 등록해야 합니다. Supabase 대시보드에 표시된 **Redirect URI**를 복사하여 카카오 개발자 콘솔에 붙여넣습니다.
    
    - Redirect URI 형식: `https://<내-프로젝트-ID>.supabase.co/auth/v1/callback`
        
5. 카카오 개발자 콘솔에서 발급받은 **REST API 키 (Client ID)**와 **Client Secret**을 Supabase 대시보드의 해당 필드에 입력하고 **Save** 버튼을 누릅니다.
    

### 3단계: Next.js 환경 변수 설정

보안을 위해 Supabase 키를 코드에 직접 작성하는 대신 환경 변수를 사용해야 합니다.

1. `user-app` 프로젝트의 최상위 폴더에 `.env.local` 파일을 생성합니다.
    
2. 아래 내용을 파일에 추가하고, 자신의 Supabase 프로젝트 URL과 Anon Key로 교체합니다. 이 값들은 Supabase 대시보드의 **Project Settings > API** 메뉴에서 찾을 수 있습니다.
    
    ```
    NEXT_PUBLIC_SUPABASE_URL=https://bbxycbghbatcovzuiotu.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJieHljYmdoYmF0Y292enVpb3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMDEwOTYsImV4cCI6MjA2NTc3NzA5Nn0.dvG6EzASvCOWQZ0AEHMseTV7WvgOnHNkt58NAviW5is
    ```
    

이제 코드 수정 단계로 넘어가겠습니다.