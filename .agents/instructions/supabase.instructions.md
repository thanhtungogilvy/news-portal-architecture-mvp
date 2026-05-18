---
applyTo: "app/**/*.ts, app/**/*.vue, server/**/*.ts"
---

# Supabase

Client-side Supabase **chỉ dùng cho auth**. Business data luôn đi qua `server/api/`.

## Before Working

- Supabase thay đổi nhanh: trước task Supabase có schema/auth/RLS/storage/key change, check `https://supabase.com/changelog.md` và docs liên quan.
- Với repo này dùng `@nuxtjs/supabase`; nếu nghi ngờ env/config, kiểm tra `node_modules/@nuxtjs/supabase/dist/module.mjs` hoặc docs module hiện tại.
- Sau khi sửa schema/RLS/query, phải verify bằng query/test cụ thể. Không coi patch SQL là xong nếu chưa có bước verify.

## Rule cứng

```
Client (browser)
  ├── useSupabaseUser()       ← reactive current user ✓
  ├── useSupabaseClient()     ← auth operations only ✓
  └── supabase.from(...)      ← KHÔNG được gọi business data ✗

Server (server/api, server/services, server/repositories)
  ├── serverSupabaseClient(event)      ← data queries ✓
  └── serverSupabaseServiceRole(event) ← bypass RLS khi cần ✓
```

## Biến môi trường Supabase

| Biến | Dùng ở | Được module đọc tự động |
|------|--------|------------------------|
| `NUXT_PUBLIC_SUPABASE_URL` | Browser + server client | ✓ recommended |
| `NUXT_PUBLIC_SUPABASE_KEY` | Browser + server client | ✓ recommended; dùng publishable key (`sb_publishable_...`) |
| `NUXT_SUPABASE_SECRET_KEY` | server only admin client | ✓ recommended; dùng secret key (`sb_secret_...`) |
| `SUPABASE_URL` | Legacy fallback | ✓ fallback |
| `SUPABASE_KEY` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_ANON_KEY` | Legacy fallback | ✓ fallback |
| `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Legacy fallback | ✓ fallback |
| `SUPABASE_PROJECT_REF` | `supabase gen types` CLI | ✗ chỉ CLI |

Không dùng `SUPABASE_SERVICE_KEY` cho code mới; module vẫn hỗ trợ nhưng đã deprecated, migrate sang `NUXT_SUPABASE_SECRET_KEY`.
Legacy anon/service_role keys vẫn có thể hoạt động trong 2026, nhưng code mới nên dùng publishable/secret keys.

## Security model

### Public — được phép expose

| Thứ | Lý do |
|---|---|
| `SUPABASE_URL` (project URL) | Public by design — như Firebase project ID |
| publishable key / legacy anon key | Dùng trong browser được, nhưng chỉ an toàn khi RLS + grants đúng |
| Auth endpoint trong Network tab | Mọi browser auth đều visible — bình thường |

Bảo mật thật sự dựa vào **RLS policies** và **server-side permission checks**, không phải ẩn URL hay key.

### Secret — KHÔNG BAO GIỜ expose

**`NUXT_SUPABASE_SECRET_KEY` / legacy `SUPABASE_SECRET_KEY` (secret/service role key):**
- Chỉ dùng trong `server/` qua `serverSupabaseServiceRole(event)`
- Bypass toàn bộ RLS — nếu lộ ra client là lỗ hổng nghiêm trọng
- Không bao giờ import trong `app/`
- Không bao giờ trả về trong API response body
- Không bao giờ log ra console

```ts
// ✗ Tuyệt đối không làm
// app/composables/anything.ts
const client = createClient(url, process.env.NUXT_SUPABASE_SECRET_KEY)

// ✗ Không trả key qua API
// server/api/debug.get.ts
return { key: useRuntimeConfig().supabaseSecretKey }

// ✓ Đúng — chỉ dùng trong server handler
// server/repositories/admin.ts
const admin = await serverSupabaseServiceRole(event)
```

### Checklist bảo mật Supabase

- [ ] `NUXT_SUPABASE_SECRET_KEY` / legacy `SUPABASE_SECRET_KEY` chỉ có trong `.env`, không bao giờ hardcode
- [ ] `.env` nằm trong `.gitignore`
- [ ] Mọi bảng data có `ENABLE ROW LEVEL SECURITY`
- [ ] Client không gọi `supabase.from(...)` trực tiếp cho business data
- [ ] `app_metadata` chỉ được set qua service role (server), không phải user
- [ ] Không dùng `raw_user_meta_data` / `user_metadata` cho authorization hoặc RLS
- [ ] Nếu dùng `app_metadata`/JWT claims cho authorization, nhớ token có thể stale cho tới khi refresh
- [ ] View exposed cho `anon`/`authenticated` phải dùng `security_invoker = true` trên Postgres 15+
- [ ] Policy `UPDATE` phải có policy `SELECT` tương ứng, nếu không update có thể trả 0 rows
- [ ] Secret/service role key không nằm trong client bundle, logs, API response, hoặc git history

## ✓ Cách dùng đúng

**Client — auth composable:**
```ts
// app/composables/auth/useAuth.ts
export function useAuth() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const isAuthenticated = computed(() => user.value !== null)

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    await navigateTo('/login')
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${useRuntimeConfig().public.siteUrl}/auth/reset-password`,
    })
    if (error) throw error
  }

  return { user, isAuthenticated, signIn, signOut, resetPassword }
}
```

**Client — type Supabase client với Database:**
```ts
import type { Database } from '~/types/database.types'

// Typed client — autocomplete cho table names và column shapes
const client = useSupabaseClient<Database>()
```

**Server — repository dùng serverSupabaseClient:**
```ts
// server/repositories/buildings.ts
import { serverSupabaseClient } from '#supabase/server'
import type { H3Event } from 'h3'

export const BuildingRepository = {
  async findById(event: H3Event, id: string) {
    const client = await serverSupabaseClient(event)
    const { data, error } = await client
      .from('buildings')
      .select('*')
      .eq('id', id)
      .single()

    if (error?.code === 'PGRST116') {
      throw createError({
        statusCode: 404,
        data: { error: { code: 'NOT_FOUND', message: 'Không tìm thấy tòa nhà' } },
      })
    }
    if (error) {
      throw createError({
        statusCode: 500,
        data: { error: { code: 'INTERNAL_ERROR', message: 'Không tải được dữ liệu' } },
      })
    }

    return mapBuilding(data)
  },
}
```

**Server — dùng service role chỉ khi cần bypass RLS:**
```ts
// server/utils/admin.ts
import { serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

// Chỉ dùng cho admin operations: seed, migration, cross-user queries
export async function getAdminClient(event: H3Event) {
  return serverSupabaseServiceRole(event)
}
```

**Server — lấy current user để check auth:**
```ts
// server/utils/auth.ts
import { serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'

export async function requireAuth(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      data: { error: { code: 'UNAUTHENTICATED', message: 'Yêu cầu đăng nhập' } },
    })
  }
  return user
}
```

**Supabase config trong nuxt.config.ts:**
```ts
// nuxt.config.ts — đã configured
supabase: {
  redirect: false,  // tự xử lý redirect trong auth middleware của Nuxt
}
```

## ✗ Cách không được dùng

```ts
// ✗ Đừng gọi business data trực tiếp từ client
// app/composables/buildings/useBuildingList.ts
const supabase = useSupabaseClient()
const { data } = await supabase.from('buildings').select('*')
// → Dùng: $fetch('/api/buildings')

// ✗ Đừng dùng service role thay thế cho RLS
// Service role bypass tất cả RLS policy — chỉ dùng khi thật sự cần
const admin = await serverSupabaseServiceRole(event)
const { data } = await admin.from('buildings').select('*') // ← tránh dùng mặc định

// ✗ Đừng bỏ qua kiểm tra error từ Supabase
const { data } = await client.from('buildings').select('*').single()
return mapBuilding(data) // data có thể null nếu có error

// ✗ Đừng lưu session token thủ công — module tự manage
localStorage.setItem('access_token', session.access_token)

// ✗ Đừng dùng untyped client nếu có thể type được
const client = useSupabaseClient()           // ✗ untyped
const client = useSupabaseClient<Database>() // ✓ typed
```

## Supabase SQL Files

**Quy tắc:** Mọi thay đổi liên quan đến Supabase data (tạo bảng, RLS, seed, admin setup) đều phải có file `.sql` tương ứng trong `supabase/`. File phải an toàn trước khi apply.

Khi có CLI/MCP:
- Iterate schema bằng MCP `execute_sql` hoặc `supabase db query`; không tạo migration history cho mỗi lần thử.
- Khi ready commit migration, tạo file bằng `supabase migration new <name>` rồi đưa SQL cuối vào file đó.
- Nếu CLI command không chắc, chạy `supabase --help`, `supabase db --help`, hoặc `supabase migration --help`; không đoán flags.
- Chạy advisors nếu có: `supabase db advisors` hoặc MCP `get_advisors`.

Khi không có CLI/MCP:
- Tạo file SQL trong `supabase/migrations/` hoặc `supabase/seeds/`.
- Chạy trên dev project qua Supabase Dashboard SQL Editor.
- Verify bằng query cuối file trước khi coi task hoàn tất.

### Folder structure

```
supabase/
├── migrations/    ← schema changes: CREATE TABLE, ALTER, RLS policies, functions
└── seeds/         ← initial data, admin setup, one-time scripts
```

### Naming convention

```
migrations/  YYYYMMDD_<kebab-case-description>.sql
seeds/       <kebab-case-description>.sql
```

Nếu dùng `supabase migration new <name>`, giữ filename do CLI tạo ra.

Ví dụ:
```
supabase/migrations/20260514_create_buildings.sql
supabase/migrations/20260514_buildings_rls.sql
supabase/seeds/set_admin_role.sql
```

### Migration template (CREATE TABLE + RLS)

Mọi migration phải:
- Bọc trong `BEGIN / COMMIT` — nếu có lỗi, tự động rollback toàn bộ
- `REVOKE ALL` trước khi `GRANT` cụ thể — deny-by-default
- `ENABLE ROW LEVEL SECURITY` ngay sau khi tạo bảng trong exposed schema
- Grant role tối thiểu cho Data API, rồi để RLS quyết định row access
- Policy dùng `auth.uid()` hoặc `auth.jwt()` — không được dùng `USING (true)` cho bảng chứa data thật
- `INSERT`/`UPDATE` phải có `WITH CHECK`; `UPDATE` cũng cần `SELECT` policy tương ứng

```sql
-- =============================================================================
-- Migration: <description>
-- Date: YYYY-MM-DD
-- Run in: MCP/CLI or Supabase Dashboard SQL Editor
-- =============================================================================

BEGIN;

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.<table_name> (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- <columns>
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Lock down access — deny public by default
REVOKE ALL ON TABLE public.<table_name> FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.<table_name> TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.<table_name> TO service_role;
-- Chỉ grant anon nếu table thật sự public:
-- GRANT SELECT ON TABLE public.<table_name> TO anon;

-- 3. Enable RLS — REQUIRED, không có RLS = lỗ hổng nghiêm trọng
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies — dùng auth.uid() hoặc auth.jwt(), KHÔNG dùng USING (true)
--
--   Pattern A: user chỉ thấy data của mình
CREATE POLICY "<table_name>: owner read"
  ON public.<table_name> FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "<table_name>: owner insert"
  ON public.<table_name> FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "<table_name>: owner update"
  ON public.<table_name> FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

--   Pattern B: admin thấy tất cả (role từ app_metadata)
CREATE POLICY "<table_name>: admin read all"
  ON public.<table_name> FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Không dùng raw_user_meta_data/user_metadata trong RLS; user có thể tự sửa metadata đó.

--   Pattern C: bảng shared (buildings, rooms) — authenticated user đọc được
--   Dùng khi data không phải user-private nhưng vẫn cần đăng nhập
CREATE POLICY "<table_name>: authenticated read"
  ON public.<table_name> FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- 5. updated_at auto-trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER  -- INVOKER, không phải DEFINER, để chạy với quyền caller
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_<table_name>_updated_at
  BEFORE UPDATE ON public.<table_name>
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;

-- Verify (chạy sau COMMIT)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = '<table_name>';
```

### Seed template

Seed phải:
- Bọc trong `BEGIN / COMMIT`
- Kiểm tra tồn tại trước khi INSERT / UPDATE
- Không hardcode password hay secret

```sql
-- =============================================================================
-- Seed: <description>
-- Date: YYYY-MM-DD
-- Run in: MCP/CLI or Supabase Dashboard SQL Editor
-- =============================================================================

BEGIN;

-- Guard: chỉ chạy nếu điều kiện thoả
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ... WHERE ...) THEN
    -- insert / update logic
  END IF;
END;
$$;

COMMIT;

-- Verify
SELECT ...;
```

### Security checklist — bắt buộc trước khi apply

- [ ] Wrapped trong `BEGIN / COMMIT`
- [ ] `REVOKE ALL` khỏi `public`, `anon`, `authenticated` trước `GRANT`
- [ ] `ENABLE ROW LEVEL SECURITY` cho mọi bảng data
- [ ] Grants tối thiểu cho `anon`/`authenticated`; không grant Data API nếu app không cần browser access
- [ ] Policy dùng `auth.uid()` hoặc `auth.jwt()` — không có `USING (true)` cho data thật
- [ ] `auth.jwt()` chỉ đọc `app_metadata`, không đọc `user_metadata`
- [ ] `INSERT`/`UPDATE` có `WITH CHECK`; `UPDATE` có `SELECT` policy tương ứng
- [ ] View exposed dùng `WITH (security_invoker = true)` hoặc không expose cho `anon`/`authenticated`
- [ ] Function dùng `SECURITY INVOKER` (không phải `DEFINER`) trừ khi có lý do rõ ràng
- [ ] `SECURITY DEFINER` function không nằm trong exposed schema
- [ ] Không có dynamic SQL với string concatenation (`EXECUTE 'SELECT ' || user_input`)
- [ ] Không hardcode secret, token, hay password trong file
- [ ] Có `SELECT` verify cuối file

### ✗ Anti-patterns

```sql
-- ✗ Không có RLS trên exposed/granted table = data có thể bị đọc rộng hơn mong muốn
CREATE TABLE public.invoices (...);
-- phải thêm: ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ✗ USING (true) trên bảng data thật = bypass access control
CREATE POLICY "read all" ON public.invoices FOR SELECT USING (true);

-- ✗ SECURITY DEFINER không cần thiết = function chạy với quyền owner, rất nguy hiểm
CREATE FUNCTION get_all_users() RETURNS ... SECURITY DEFINER ...;

-- ✗ Dynamic SQL với input không sanitize = SQL injection
EXECUTE 'SELECT * FROM ' || table_name;

-- ✗ Grant quá rộng
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
```

### Khi nào tạo file nào

| Hành động | Folder | Ví dụ |
|---|---|---|
| Tạo bảng mới | `migrations/` | `20260601_create_rooms.sql` |
| Thêm column / index | `migrations/` | `20260601_rooms_add_floor.sql` |
| Thêm / sửa RLS policy | `migrations/` | `20260601_rooms_rls.sql` |
| Tạo DB function / trigger | `migrations/` | `20260601_updated_at_trigger.sql` |
| Set app_metadata / role | `seeds/` | `set_admin_role.sql` |
| Seed dữ liệu mẫu | `seeds/` | `seed_buildings.sql` |

### Workflow

1. Tạo `.sql` file cùng lúc với code feature (trong cùng task group)
2. Tự review theo Security checklist ở trên trước khi apply
3. Apply trên dev bằng MCP/CLI nếu có; nếu không có thì dùng **Supabase Dashboard → SQL Editor**
4. Verify kết quả bằng `SELECT` cuối file hoặc test query tương đương
5. Apply lên staging/prod theo migration order

## Data API & RLS Debugging

- Data API access cần cả `GRANT` và RLS policy. `GRANT` quyết định role chạm được object; RLS quyết định row nào thấy/sửa được.
- Nếu SQL-created table trả `42501` hoặc client không thấy bảng, kiểm tra Data API settings/exposed schema và grants trước khi sửa RLS.
- Nếu `UPDATE` không lỗi nhưng trả 0 rows, kiểm tra có `SELECT` policy cho row đó chưa.
- Nếu view bypass RLS, dùng `CREATE VIEW ... WITH (security_invoker = true)` trên Postgres 15+ hoặc revoke khỏi `anon`/`authenticated`.

## Storage Notes

- Storage policy cũng là RLS trên `storage.objects`; không public bucket khi file chứa dữ liệu user/private.
- Upsert object cần quyền `INSERT` + `SELECT` + `UPDATE`; thiếu `SELECT`/`UPDATE` có thể khiến replace fail.
