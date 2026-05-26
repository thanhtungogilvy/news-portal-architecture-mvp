# Frontend + Backend Project Presentation Notes

## Mục tiêu

Tài liệu này tổng hợp:

- Cấu trúc trình bày một dự án có cả frontend và backend
- Cách map cấu trúc đó vào đúng project `news-portal-architecture-mvp`
- Outline slide-by-slide
- Speaker notes 5 phút

---

## 1. Khi present một dự án có cả FE và BE, nên đi theo cấu trúc nào?

Thay vì tách riêng một khối frontend rồi một khối backend quá sớm, nên dẫn người nghe theo luồng:

1. `Why`
   Dự án giải quyết vấn đề gì
2. `What`
   Phạm vi và chức năng chính là gì
3. `How`
   Kiến trúc hệ thống và data flow hoạt động ra sao
4. `Why this design`
   Vì sao chọn kiến trúc, công nghệ, và cách tách lớp như vậy
5. `What we learned`
   Kết quả, trade-offs, và bài học

### Các mục nên có

1. Problem statement
2. Project scope
3. System architecture
4. Key user flows
5. Frontend architecture
6. Backend architecture
7. Database design
8. Security / auth / validation
9. Challenges and trade-offs
10. Demo and conclusion

### Nguyên tắc dẫn dắt người nghe

- Mở bằng bài toán và mục tiêu trước khi nói kỹ thuật
- Trình bày kiến trúc tổng thể trước khi đi vào file/module cụ thể
- Dùng 1-2 flow tiêu biểu để nối frontend với backend
- Nhấn mạnh vai trò của frontend trong việc hiểu data flow, auth flow, API contract và business logic trigger

---

## 2. Map đúng vào project này

### Project overview

Project này là một **news portal** gồm 2 phần:

- Public website cho người đọc
- Admin CMS cho biên tập viên

Mục tiêu:

- Hiển thị danh sách bài viết
- Lọc theo category
- Xem chi tiết bài viết
- Quản lý category và news trong admin
- Phân quyền admin

### High-level architecture

Project dùng:

- Nuxt 4
- Vue 3
- TypeScript
- Supabase Auth
- Supabase Postgres
- Supabase RLS

Kiến trúc tổng thể:

- `app/` là frontend UI
- `server/api/` là transport layer
- `server/services/` là business logic
- `server/repositories/` là data access
- Supabase là auth + database + security layer

### Điểm quan trọng nhất cần nói

Trong project này, frontend **không gọi business data trực tiếp xuống database**.

Frontend đi theo flow:

`UI -> server/api -> service -> repository -> Supabase`

Đây là ý nên dùng làm backbone cho bài present.

### Source tham chiếu chính

- [nuxt.config.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/nuxt.config.ts:1)
- [server/api/news/index.get.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/api/news/index.get.ts:1)
- [server/services/news.service.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/services/news.service.ts:1)
- [server/repositories/news.repository.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/repositories/news.repository.ts:1)

---

## 3. Data model nên trình bày thế nào trong project này

### Entity chính

- `categories`
- `news`

### Quan hệ

- `categories (1) -> news (N)`
- foreign key: `news.category_id`

### Field quan trọng trong `news`

- `status`
- `view_count`
- `published_at`
- `author_id`
- `author_name`
- `author_avatar_url`

### Ý nghĩa với frontend

- Category page filter theo category
- Home page sort bài mới theo `published_at`
- Most viewed section sort theo `view_count`
- CMS cần `status` để quản lý draft / published / archived
- Detail page render author info và social proof

### Source tham chiếu

- [supabase/migrations/20260518141133_create_categories.sql](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/supabase/migrations/20260518141133_create_categories.sql:1)
- [supabase/migrations/20260518141134_create_news.sql](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/supabase/migrations/20260518141134_create_news.sql:1)
- [supabase/migrations/20260519092231_add_author_to_news.sql](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/supabase/migrations/20260519092231_add_author_to_news.sql:1)

---

## 4. Hai flow chính nên dùng để present project này

### Flow A. Public reading flow

Luồng đề xuất:

1. User vào home page
2. User vào category page
3. User mở news detail
4. Frontend trigger tăng view count

#### Home page

Frontend load:

- featured news
- most viewed news
- category list
- all news

Source:

- [app/pages/index.vue](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/pages/index.vue:1)
- [app/composables/news/useFeaturedNews.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/composables/news/useFeaturedNews.ts:1)
- [app/composables/news/useMostViewedNews.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/composables/news/useMostViewedNews.ts:1)
- [app/composables/category/useCategoryList.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/composables/category/useCategoryList.ts:1)

#### Category page

Frontend:

- lấy `slug` từ route
- gọi list API với `category` và `page`
- render pagination, loading, empty, not found

Source:

- [app/pages/categories/[slug].vue](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/pages/categories/%5Bslug%5D.vue:1)
- [app/composables/news/useNewsList.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/composables/news/useNewsList.ts:1)
- [server/api/news/index.get.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/api/news/index.get.ts:1)
- [server/services/news.service.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/services/news.service.ts:18)

#### News detail

Frontend:

- fetch article theo slug
- sau khi load xong thì gọi API tăng `view_count`
- lấy related news theo category

Source:

- [app/pages/news/[slug].vue](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/pages/news/%5Bslug%5D.vue:1)
- [app/composables/news/useNewsDetail.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/composables/news/useNewsDetail.ts:1)
- [server/api/news/[slug].get.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/api/news/%5Bslug%5D.get.ts:1)
- [server/api/news/[id]/view.post.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/api/news/%5Bid%5D/view.post.ts:1)
- [supabase/migrations/20260518150727_add_increment_view_count_rpc.sql](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/supabase/migrations/20260518150727_add_increment_view_count_rpc.sql:1)

#### Thông điệp nên chốt

Frontend không chỉ render dữ liệu. Frontend phải hiểu:

- category relationship
- pagination contract
- detail data flow
- thời điểm trigger business action như view count

---

### Flow B. Admin CMS flow

Luồng đề xuất:

1. Admin login
2. Vào dashboard/CMS
3. Quản lý news
4. Quản lý categories

#### Login

Frontend:

- gọi `signInWithPassword`
- lưu auth state
- redirect vào `/admin`

Source:

- [app/pages/admin/login.vue](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/pages/admin/login.vue:1)
- [app/composables/auth/useAuth.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/composables/auth/useAuth.ts:1)
- [app/middleware/auth.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/middleware/auth.ts:1)

#### Authorization

Backend:

- server check user session
- derive role từ JWT `app_metadata.role`
- chỉ cho admin access protected APIs

Source:

- [server/utils/auth.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/utils/auth.ts:1)
- [server/api/admin/news/index.get.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/api/admin/news/index.get.ts:1)
- [server/api/admin/categories/index.get.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/api/admin/categories/index.get.ts:1)

#### CMS operations

- list news có pagination/filter
- create/update/delete news
- create/update/delete category

Source:

- [app/composables/admin/useAdminNews.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/composables/admin/useAdminNews.ts:1)
- [app/composables/admin/useAdminCategories.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/composables/admin/useAdminCategories.ts:1)
- [server/api/admin/news/index.post.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/api/admin/news/index.post.ts:1)

#### Thông điệp nên chốt

Authentication bắt đầu ở frontend, nhưng authorization thật sự được enforce ở:

- backend API
- database RLS

---

## 5. Backend architecture nên giải thích thế nào

### API layer

Trách nhiệm:

- parse request
- validate input bằng Zod
- trả response chuẩn

Source:

- [server/api/news/index.get.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/api/news/index.get.ts:1)
- [app/utils/validators/news.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/utils/validators/news.ts:1)
- [server/utils/response.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/utils/response.ts:1)

### Service layer

Trách nhiệm:

- resolve category slug -> category id
- business rules
- publish logic
- throw domain errors

Source:

- [server/services/news.service.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/services/news.service.ts:18)
- [server/services/category.service.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/services/category.service.ts:1)

### Repository layer

Trách nhiệm:

- query Supabase/Postgres
- pagination
- sorting/filtering
- mapping row -> DTO

Source:

- [server/repositories/news.repository.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/repositories/news.repository.ts:10)
- [server/repositories/category.repository.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/repositories/category.repository.ts:1)

### Câu chốt

Kiến trúc này giúp:

- business logic không bị nhét vào component frontend
- API contract rõ ràng hơn
- backend maintainable hơn
- frontend consume data ổn định hơn

---

## 6. Auth, security, validation, error handling

### Auth

- login dùng Supabase Auth
- server đọc session bằng Supabase server helpers
- role admin lấy từ JWT `app_metadata.role`

Source:

- [app/composables/auth/useAuth.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/composables/auth/useAuth.ts:1)
- [server/utils/auth.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/utils/auth.ts:1)

### RLS / authorization

- public được đọc categories
- public được đọc published news
- admin mới được read/write đầy đủ ở CMS

Source:

- [supabase/migrations/20260518141133_create_categories.sql](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/supabase/migrations/20260518141133_create_categories.sql:10)
- [supabase/migrations/20260518141134_create_news.sql](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/supabase/migrations/20260518141134_create_news.sql:19)
- [supabase/migrations/20260518160000_tighten_rls_admin_only.sql](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/supabase/migrations/20260518160000_tighten_rls_admin_only.sql:1)

### Validation

- input/query validate bằng Zod
- lỗi validation trả về chuẩn hóa

Source:

- [app/utils/validators/news.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/utils/validators/news.ts:1)
- [app/utils/validators/category.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/utils/validators/category.ts:1)

### Error handling

Các nhóm lỗi chính:

- `401` unauthenticated
- `403` forbidden
- `404` not found
- `422` validation error
- `500` internal error

Source:

- [server/utils/errors.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/utils/errors.ts:1)
- [server/plugins/error-handler.ts](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/server/plugins/error-handler.ts:1)

### FE responsibility

Frontend chịu trách nhiệm biến response backend thành:

- loading state
- empty state
- not found state
- auth redirect
- validation feedback

Source:

- [app/pages/categories/[slug].vue](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/pages/categories/%5Bslug%5D.vue:38)
- [app/pages/news/[slug].vue](/Users/thanhtung.nguyen/Documents/company/news-portal-architecture-mvp/app/pages/news/%5Bslug%5D.vue:45)

---

## 7. Technical decisions và trade-offs nên nói

### Decision 1. Dùng Nuxt full-stack

Lý do:

- FE và API ở cùng repo
- giảm context switching
- dễ chia sẻ type/composable

### Decision 2. Dùng Supabase cho auth + DB + RLS

Lý do:

- đi nhanh
- có sẵn auth
- có Postgres
- có security layer ở DB

### Decision 3. Tách `api -> service -> repository`

Lý do:

- route handler gọn hơn
- business logic tập trung
- data access dễ maintain hơn

### Decision 4. Tăng view count bằng RPC riêng

Lý do:

- atomic update
- không nhét logic tăng view vào UI
- giảm risk race condition

---

## 8. Outline slide-by-slide

### Slide 1. Project Overview

**Title:** News Portal Architecture MVP

**Nội dung trên slide:**

- Public news website
- Admin CMS for editors
- Built with Nuxt 4 + Supabase
- Goal: manage, publish, and deliver news content

**Ý chính cần nói:**

- Đây là một news portal gồm public site và admin portal
- Đây là một full-stack system, không chỉ là UI

---

### Slide 2. Problem & Scope

**Title:** What This Project Solves

**Nội dung trên slide:**

- Readers browse published articles
- Readers filter by category
- Readers view article details
- Editors manage categories and news
- Admin-only access for CMS

**Ý chính cần nói:**

- Scope tập trung vào reading flow, CMS flow, auth, pagination và architecture

---

### Slide 3. System Architecture

**Title:** High-Level Architecture

**Nội dung trên slide:**

- `app/` = frontend UI
- `server/api/` = transport layer
- `server/services/` = business logic
- `server/repositories/` = data access
- Supabase = Auth + Postgres + RLS

**Diagram nên vẽ:**

`User -> Nuxt UI -> Server API -> Service -> Repository -> Supabase DB/Auth`

**Ý chính cần nói:**

- Frontend không gọi business data trực tiếp xuống database
- Dữ liệu đi qua API, service, repository

---

### Slide 4. Data Model

**Title:** Core Data Model

**Nội dung trên slide:**

- `categories`
- `news`
- `categories (1) -> news (N)`
- key fields:
  - `category_id`
  - `status`
  - `view_count`
  - `published_at`
  - `author_id`

**Ý chính cần nói:**

- Data model ảnh hưởng trực tiếp tới UI và query pattern

---

### Slide 5. Public Reading Flow

**Title:** Public User Flow

**Nội dung trên slide:**

- Home page loads featured, most viewed, categories
- Category page uses paginated list API
- News detail fetches article by slug
- Detail page triggers view-count update

**Ý chính cần nói:**

- Frontend phải hiểu pagination contract và business trigger

---

### Slide 6. Admin Flow

**Title:** Admin CMS Flow

**Nội dung trên slide:**

- Admin login with Supabase Auth
- Protected admin routes
- Manage categories
- Manage news articles
- Server checks admin role before processing requests

**Ý chính cần nói:**

- Frontend handle sign-in state
- Backend và DB enforce permission

---

### Slide 7. Backend Architecture

**Title:** Layered Backend Design

**Nội dung trên slide:**

- API layer
- Service layer
- Repository layer

**Ý chính cần nói:**

- API validate request
- Service giữ business rule
- Repository xử lý query

---

### Slide 8. Authentication & Security

**Title:** Auth and Access Control

**Nội dung trên slide:**

- Login with Supabase Auth
- Role from JWT `app_metadata.role`
- Public reads published content
- Admin manages CMS
- RLS enforces DB access

**Ý chính cần nói:**

- Authorization không nằm ở frontend alone

---

### Slide 9. Validation, Errors, and UX

**Title:** Reliability from API to UI

**Nội dung trên slide:**

- Zod validation
- Standard success/error shape
- Loading / empty / not found / auth failure

**Ý chính cần nói:**

- Backend đảm bảo dữ liệu đúng
- Frontend biến response thành UX rõ ràng

---

### Slide 10. Technical Decisions & Conclusion

**Title:** Key Decisions and Takeaways

**Nội dung trên slide:**

- Nuxt full-stack
- Supabase auth + DB + RLS
- Service/repository separation
- Atomic RPC for view count
- FE role = understand architecture and data flow

**Ý chính cần nói:**

- Vai trò frontend là hiểu đúng system behavior, không chỉ render UI

---

## 9. Speaker notes 5 phút

### Mở bài

“Project này là một news portal gồm 2 phần chính: public website cho người đọc và admin CMS cho biên tập viên. Về mặt kỹ thuật, đây là một Nuxt full-stack application, trong đó frontend UI nằm trong `app/`, backend API nằm trong `server/api`, còn authentication, database và security được quản lý bởi Supabase.

Trong phần trình bày này, em sẽ đi theo luồng hệ thống, tức là từ bài toán, tới kiến trúc tổng thể, rồi tới 2 flow chính là public reading flow và admin CMS flow.”

### Phần 1. Project scope

“Về scope, phía public cho phép người dùng xem danh sách bài viết, lọc theo chuyên mục, và xem chi tiết bài viết. Phía admin cho phép biên tập viên đăng nhập, quản lý category và quản lý news articles.

Như vậy project này có đủ các thành phần của một hệ thống full-stack cơ bản: frontend UI, API layer, business logic, database schema, authentication và authorization.”

### Phần 2. Architecture

“Kiến trúc tổng thể của project được chia thành nhiều lớp.

Lớp đầu tiên là frontend trong `app/`, nơi render giao diện và gọi API.  
Lớp thứ hai là `server/api`, đóng vai trò transport layer, nhận request, validate input và trả response.  
Tiếp theo là `server/services`, nơi chứa business logic.  
Sau đó là `server/repositories`, nơi thực hiện query với Supabase/Postgres.  
Bên dưới cùng là Supabase, cung cấp database, auth, và row-level security.

Điểm quan trọng ở đây là frontend không gọi business data trực tiếp xuống database. Tất cả dữ liệu nghiệp vụ đều đi qua server API layer. Điều này giúp API contract rõ ràng hơn và business logic không bị phân tán vào component phía frontend.”

### Phần 3. Data model

“Về data model, hệ thống có 2 entity chính là `categories` và `news`. Quan hệ là một category có nhiều news, thông qua foreign key `news.category_id`.

Ngoài ra bảng `news` còn có một số field quan trọng như `status`, `view_count`, `published_at` và `author_id`. Những field này ảnh hưởng trực tiếp tới giao diện và data fetching strategy.

Ví dụ:
- category page cần filter theo category
- home page cần sort bài mới theo `published_at`
- mục most viewed cần sort theo `view_count`
- admin CMS cần `status` để quản lý draft, published và archived”

### Phần 4. Public flow

“Nếu nhìn từ góc độ người dùng public, flow chính bắt đầu từ home page. Ở đó frontend load featured news, most viewed news, category list và danh sách bài viết.

Khi user vào category page, frontend lấy `slug` từ route và gọi list API với query category và page. API trả về dữ liệu có pagination metadata như `total`, `page`, `limit`, `totalPages`, và frontend dùng nó để render pagination, loading state, empty state hoặc not found state.

Khi user mở một bài viết, frontend gọi API lấy article detail theo slug. Sau khi load xong, frontend còn trigger thêm một API khác để tăng `view_count`. Business logic này không nằm trong component UI mà được xử lý ở backend/database thông qua một RPC để đảm bảo update atomic.

Điểm em muốn nhấn mạnh ở flow này là frontend không chỉ hiển thị dữ liệu, mà còn phải hiểu đúng API behavior, pagination contract và thời điểm trigger business actions.”

### Phần 5. Admin flow

“Flow thứ hai là admin CMS. Admin đăng nhập bằng Supabase Auth. Ở frontend, login form gọi `signInWithPassword`, sau đó chuyển vào khu vực admin.

Tuy nhiên việc đăng nhập thành công chưa đủ để đảm bảo quyền truy cập. Ở server side, mỗi admin API đều kiểm tra user và role admin thông qua JWT metadata. Ở database level, row-level security cũng tiếp tục enforce rằng chỉ admin mới có quyền đọc hoặc ghi các dữ liệu quản trị.

Điều này cho thấy authentication được bắt đầu từ frontend, nhưng authorization thật sự được enforce ở backend API và database policy.”

### Phần 6. Backend design, validation, errors

“Ở backend, API layer chịu trách nhiệm validate request bằng Zod và trả response theo format thống nhất. Service layer xử lý business rules như resolve category slug sang category id, kiểm tra not found, hoặc auto set `publishedAt` nếu bài viết được publish. Repository layer thì tập trung vào query Supabase, pagination, sorting, filtering và mapping DB rows sang DTO.

Về error handling, hệ thống chuẩn hóa các nhóm lỗi như validation error, unauthorized, forbidden, not found và internal error. Từ góc nhìn frontend, nhiệm vụ là chuyển các response này thành UX rõ ràng như loading state, auth redirect, empty state hoặc error message.”

### Kết bài

“Tóm lại, điểm quan trọng nhất của project này không chỉ là có frontend và backend, mà là cách các lớp phối hợp với nhau. Frontend gọi API theo contract rõ ràng, service layer giữ business logic, repository layer làm việc với database, còn auth và security được enforce ở nhiều lớp.

Với vai trò frontend developer, điều em tập trung không phải là implement backend internals, mà là hiểu đúng system architecture, data flow, API behavior, auth flow và cách biến chúng thành trải nghiệm ổn định cho người dùng.”

---

## 10. Mở bài và kết bài ngắn để dùng ngay

### Mở bài

“Project này là một news portal gồm public website cho người đọc và admin CMS cho biên tập viên. Về mặt kỹ thuật, đây là một Nuxt full-stack application, trong đó frontend UI nằm trong `app/`, backend API nằm trong `server/api`, còn authentication, database và row-level security được quản lý bởi Supabase. Em sẽ trình bày project theo 2 luồng chính: public reading flow và admin content-management flow, để thấy rõ frontend và backend phối hợp với nhau như thế nào.”

### Kết bài

“Từ project này, điểm quan trọng nhất không phải là frontend hay backend tách rời, mà là cách toàn bộ hệ thống kết nối với nhau: frontend gọi API theo contract rõ ràng, service layer giữ business logic, repository layer làm việc với database, còn auth và security được enforce ở nhiều lớp. Với vai trò frontend developer, điều em tập trung là hiểu đúng data flow, API behavior, auth flow và cách biến chúng thành trải nghiệm ổn định cho người dùng.”
