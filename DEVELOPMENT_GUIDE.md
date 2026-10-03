# Hướng Dẫn Phát Triển Dự Án (Smart Explorer)

Tài liệu này cung cấp cái nhìn tổng quan về kiến trúc, các công nghệ được sử dụng và cấu trúc thư mục của dự án **Smart Explorer**. Mục tiêu là giúp việc phát triển logic backend, kết nối frontend, và mở rộng dự án sau này trở nên dễ dàng, khoa học và dễ bảo trì.

## 1. Giới Thiệu Dự Án

**Smart Explorer** là nền tảng học tập STEM tương tác song ngữ. Nền tảng kết hợp các bài học lý thuyết, bài kiểm tra (quizzes), hỗ trợ học tập bằng AI, và mô phỏng 3D để giúp học sinh nắm bắt kiến thức một cách trực quan và sinh động nhất.

## 2. Tech Stack (Công Nghệ Sử Dụng)

### Frontend

- **Framework:** Next.js 15 (React 19) với App Router - Tối ưu SEO và Server-Side Rendering (SSR).
- **Styling:** Tailwind CSS - Viết CSS nhanh chóng và dễ mở rộng.
- **Animation:** Framer Motion - Xử lý các hiệu ứng chuyển động, mượt mà.
- **UI Components:** Shadcn UI, Lucide React (Icons).
- **Ngôn ngữ:** TypeScript.
- **State & Data Fetching:** Sử dụng `fetch` API kết hợp với Server Components. React Context (ví dụ: AuthContext, LanguageContext).

### Backend

- **Runtime & Framework:** Node.js và Express.js.
- **Ngôn ngữ:** TypeScript.
- **Cơ sở dữ liệu:** PostgreSQL - Database quan hệ mạnh mẽ, đáng tin cậy.
- **ORM:** Prisma ORM - Quản lý, query database và migration chuyên nghiệp, type-safe.
- **Xác thực (Authentication):** JSON Web Token (JWT) và bcrypt (mã hóa mật khẩu).
- **Upload File:** Multer (xử lý upload ảnh/avatar cục bộ).

## 3. Cấu Trúc Thư Mục (Directory Structure)

Dự án được chia thành 2 thư mục chính độc lập (`frontend` và `backend`) theo mô hình Client-Server.

### 3.1. Frontend (`/frontend`)

Được thiết kế theo cấu trúc App Router của Next.js:

```text
frontend/
├── app/                  # Chứa các trang (Pages) và Layout theo App Router
│   ├── (auth)/           # Các trang đăng nhập, đăng ký (login, register)
│   ├── courses/          # Trang danh sách khóa học
│   ├── dashboard/        # Bảng điều khiển người dùng
│   ├── profile/          # Trang thông tin cá nhân
│   ├── ...               # Các trang khác
├── components/           # Các component dùng chung (UI, Navigation, vv.)
│   ├── ui/               # Các UI components cơ bản (Shadcn UI)
│   └── ...               # Khác: Navbar.tsx, Footer.tsx, UserMenu.tsx
├── contexts/             # React Context quản lý State toàn cục (Auth, Language)
├── lib/                  # Chứa các hàm tiện ích và gọi API (api.ts)
│   ├── api.ts            # Nơi tập trung toàn bộ các hàm gọi API đến Backend
│   └── mock-data.ts      # Dữ liệu giả (Dùng làm fallback khi dev)
├── hooks/                # Custom React hooks (useAuthGuard,...)
└── types/                # Khai báo kiểu dữ liệu TypeScript (types/index.ts)
```

### 3.2. Backend (`/backend`)

Được thiết kế theo kiến trúc **Modular (Module-based)** kết hợp **MVC/Repository Pattern**, giúp hệ thống chia nhỏ logic, không bị phình to và cực kỳ dễ bảo trì.

```text
backend/
├── prisma/               # Cấu hình ORM Prisma
│   ├── schema.prisma     # Nơi định nghĩa các bảng trong DB (Models)
│   └── migrations/       # Chứa các bản ghi lịch sử thay đổi DB
├── src/
│   ├── modules/          # Chứa các tính năng chính, mỗi tính năng là 1 folder độc lập
│   │   ├── auth/         # Module đăng nhập, đăng ký
│   │   ├── courses/      # Module khóa học
│   │   ├── users/        # Module quản lý thông tin User
│   │   └── ...
│   ├── middlewares/      # Chứa các logic chặn trước request (auth.middleware.ts)
│   ├── utils/            # Chứa các hàm tiện ích (jwt.ts, multer.ts, app-error.ts)
│   └── index.ts          # File chạy server chính (App Entry Point)
└── .env                  # Chứa biến môi trường (Database URL, JWT Secret...)
```

## 4. Hướng Dẫn Phát Triển (Development Workflow)

Để hệ thống mạch lạc và dễ mở rộng, khi làm một tính năng mới (Ví dụ: Chức năng `Lessons`), hãy làm theo trình tự 4 bước tiêu chuẩn sau:

### Bước 1: Xây dựng Database (Backend)

1. Mở file `backend/prisma/schema.prisma`.
2. Khai báo Model (Bảng) mới nếu cần, xác định các mối quan hệ (Relations).
3. Chạy lệnh: `npx prisma migrate dev --name init_lesson` để cập nhật Database.

### Bước 2: Viết Logic Backend

Trong `backend/src/modules/`, tạo thư mục cho module mới (ví dụ: `lessons/`).

- `routes.ts`: Định nghĩa các endpoint (VD: `GET /api/lessons`).
- `controller.ts`: Tiếp nhận Request từ người dùng, gọi Service và trả về Response JSON.
- `service.ts` / `repository.ts`: Viết logic nghiệp vụ, gọi Prisma để truy vấn Database.
- Sau khi viết xong, khai báo route mới vào file `backend/src/index.ts` (ví dụ: `app.use('/api/lessons', lessonRoutes)`).

### Bước 3: Gọi API ở Frontend (`lib/api.ts`)

1. Mở file `frontend/lib/api.ts`.
2. Tạo hàm fetch API mới, ví dụ: `fetchLessons()`.
3. Xử lý logic try-catch và dự phòng (Fallback mock data) để tiện test giao diện kể cả khi DB rỗng.

### Bước 4: Viết UI và Logic Frontend

1. Tạo thư mục route trong `frontend/app/` (ví dụ `app/lessons/page.tsx`).
2. Mọi việc Fetch Data nên thực hiện ở **Server Component** (không dùng `"use client"`).
3. Truyền dữ liệu fetch được vào các **Client Component** (có `"use client"`) để gắn sự kiện onClick, animation, state...

## 5. Quy Tắc Code Khoa Học (Best Practices)

1. **Chia nhỏ Component:** Frontend không viết chung 1 file dài nghìn dòng. Nếu có phần UI nào phức tạp (ví dụ: Card khóa học, Filter), hãy tách ra file riêng biệt trong thư mục `components/`.
2. **Không gọi DB trực tiếp ở Frontend:** Luôn luôn phải gọi API (HTTP Request) đi qua Backend. Backend mới là nơi nắm giữ quyền truy cập DB và Prisma.
3. **Type-Safety:** Luôn khai báo `type` hoặc `interface` đầy đủ trong TypeScript. Việc này giúp tự động gợi ý code (autocomplete) và tránh lỗi. Hãy tái sử dụng Type ở `frontend/types`.
4. **Biến môi trường:** Không hardcode URL Backend vào code. Luôn dùng biến môi trường `process.env.NEXT_PUBLIC_API_URL`.

---

_Tài liệu này được tạo ra để làm kim chỉ nam giúp bạn lập trình chuẩn xác. Chúc bạn code vui vẻ và dự án Smart Explorer thành công!_

## 6. Google OAuth và dữ liệu học tập

### Cấu hình Gemini AI Tutor

1. Tạo API key trong [Google AI Studio](https://aistudio.google.com/apikey) và chỉ lưu key trong `backend/.env` dưới tên `GEMINI_API_KEY`. Không dùng tiền tố `NEXT_PUBLIC_` và không gửi key về trình duyệt.
2. Có thể chọn model qua `GEMINI_MODEL`; mặc định dự án dùng `gemini-3.8-flash`. Kiểm tra model và hạn mức miễn phí hiện hành trong Google AI Studio vì quota phụ thuộc project và có thể thay đổi.
3. Khởi động lại backend sau khi sửa `.env`. AI Tutor yêu cầu người dùng đăng nhập; API giới hạn 10 câu hỏi mỗi phút cho mỗi tài khoản. Câu hỏi và ngữ cảnh gửi tới Gemini không nên chứa thông tin cá nhân nhạy cảm của học sinh.

Gói miễn phí của Gemini API có giới hạn tốc độ và Google có thể sử dụng dữ liệu gửi lên để cải thiện sản phẩm theo điều khoản của gói miễn phí. Hãy xem lại điều khoản hiện hành trước khi đưa dữ liệu thật của học sinh lên hệ thống.

### AI Assessment Generator

Giáo viên/Admin có thể gọi `POST /api/ai/assessments/generate` bằng app JWT; endpoint giới hạn 3 yêu cầu/phút/tài khoản để kiểm soát quota Gemini. Request JSON:

```json
{
  "grade": 6,
  "subject": "Mathematics",
  "difficulty": "MEDIUM",
  "topic": "Fractions",
  "question_count": 10,
  "locale": "vi"
}
```

`grade` nhận 1–9, `difficulty` là `EASY`/`MEDIUM`/`HARD`, và `question_count` là 5–30 để đề luôn có đủ năm loại: `MCQ`, `TRUE_FALSE`, `MATCHING`, `FILL_BLANK`, `SHORT_ANSWER`. API trả `{ success, data }`; `data` có `quiz`, `questions`, `answers`, `explanations`, `difficulty_score`. Backend xác thực JSON đầu ra, số lượng câu, cân bằng loại câu hỏi, đáp án khớp lựa chọn và mức điểm độ khó; đề lỗi cấu trúc trả `502`, không trả kết quả giả.

Trang giáo viên `/teacher/assessment-generator` cho phép nhập yêu cầu, xem JSON và sao chép. Đây là bản nháp để giáo viên kiểm duyệt, chưa được tự lưu vào bảng Quiz hiện tại vì Prisma hiện chỉ hỗ trợ `MULTIPLE_CHOICE`, `TRUE_FALSE`, `FILL_IN_BLANK`; Matching và Short Answer cần được thiết kế/lưu/chấm điểm riêng trước khi publish.

### Cấu hình Google sign-in

1. Trong Google Cloud Console, tạo OAuth Client ID loại **Web application** và thêm origin của frontend vào **Authorized JavaScript origins** (ví dụ `http://localhost:3000`).
2. Đặt cùng Client ID vào `GOOGLE_CLIENT_ID` trong `backend/.env` và `NEXT_PUBLIC_GOOGLE_CLIENT_ID` trong `frontend/.env.local`. Đặt `NEXT_PUBLIC_API_URL` trỏ tới backend, ví dụ `http://localhost:5000/api`.
3. Khởi động lại cả hai ứng dụng sau khi sửa biến môi trường. Frontend nhận Google ID token; backend xác minh chữ ký, audience và email đã xác thực rồi mới trả JWT của ứng dụng.

Google sign-in tạo tài khoản học sinh mới hoặc liên kết tài khoản đã có cùng email đã xác thực. Mật khẩu của tài khoản Google được lưu `NULL`; đăng nhập mật khẩu cho tài khoản đó vẫn bị từ chối cho tới khi có quy trình đặt mật khẩu riêng.

### Migration và API học tập

Chạy migration và sinh Prisma Client từ thư mục dự án:

```powershell
pnpm --dir backend exec prisma migrate dev
pnpm --dir backend exec prisma generate
```

### Tenant, trường và RBAC (giai đoạn 1)

Migration `20261002152600_add_tenant_membership_rbac` bổ sung nền tảng tenant/trường, membership và phân quyền theo role. Migration tạo tenant mặc định `smart-stem`, tạo các role `STUDENT`, `TEACHER`, `ADMIN`, rồi backfill user hiện có vào tenant này theo role cũ. Đăng ký email/Google mới tạo user, membership và role grant trong cùng transaction.

JWT mới mang `tenantId` và `membershipId`; token cũ vẫn được đọc để tránh làm hỏng phiên đang còn hiệu lực. Đây là bước chuẩn bị dữ liệu và danh tính tenant, **chưa bật tenant isolation cho lớp/khóa học/lesson và chưa thay thế `requireRole` hiện tại bằng permission checks**. Không coi hệ thống là multi-tenant an toàn cho production cho đến khi các bảng học tập được thêm `tenantId`, truy vấn được scope theo tenant, và có integration tests xác nhận không đọc/ghi chéo trường.

Chạy migration trong môi trường phát triển sau khi đã kiểm tra `DATABASE_URL`:

```powershell
pnpm --dir backend exec prisma migrate dev --name add_tenant_membership_rbac
pnpm --dir backend exec prisma generate
```

Migration tương ứng đã được lưu trong version control; với deployment production, áp dụng bằng `prisma migrate deploy` sau khi backup và review kế hoạch migration. Không dùng `migrate dev` trên production.

Seed script yêu cầu migration này vì nó tạo membership và role grant cho tài khoản mẫu. Tenant mặc định chỉ là cầu nối cho triển khai một trường hiện tại; hãy cập nhật thông tin school trước khi onboarding người dùng thật.

Các API dưới đây yêu cầu `Authorization: Bearer <app-jwt>`. User ID luôn được lấy từ JWT, không nhận từ request body.

| Method | Endpoint                            | Mục đích                                                                     |
| ------ | ----------------------------------- | ---------------------------------------------------------------------------- |
| `POST` | `/api/auth/google`                  | Đổi Google ID token thành user và app JWT                                    |
| `GET`  | `/api/progress`                     | Đọc tiến độ của người đang đăng nhập                                         |
| `PUT`  | `/api/progress/:lessonId`           | Tạo/cập nhật tiến độ với `{ "status": "IN_PROGRESS" }` hoặc `COMPLETED`      |
| `POST` | `/api/quizzes/:quizId/attempts`     | Nộp `{ "answers": { "<questionId>": "<answerId>" } }`; server tự chấm và lưu |
| `GET`  | `/api/quizzes/attempts?quizId=<id>` | Đọc lịch sử quiz của người đang đăng nhập; `quizId` là tùy chọn              |

Quiz phải tồn tại trong database và mỗi câu phải có đáp án. Endpoint lesson chỉ trả ID/nội dung đáp án, không trả `isCorrect`; điểm số và phần trăm được tính ở backend. Submit quiz lưu `QuizAttempt` và cập nhật điểm tiến độ trong cùng transaction.

### Kiểm tra cục bộ

Sau khi cấu hình OAuth và có dữ liệu lesson/quiz trong database, chạy backend (`pnpm --dir backend dev`) và frontend (`pnpm --dir frontend dev`), đăng nhập bằng Google, mở một lesson đã lưu, đánh dấu hoàn thành và nộp quiz. Xác nhận `GET /api/progress` và `GET /api/quizzes/attempts` trả về dữ liệu của JWT hiện tại; request không có token phải trả `401`.
