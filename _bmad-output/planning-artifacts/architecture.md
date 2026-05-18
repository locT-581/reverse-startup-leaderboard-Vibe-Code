---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: "complete"
completedAt: "2026-05-18"
inputDocuments:
  - /Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md
  - /Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/ux-design-specification.md
workflowType: "architecture"
project_name: "Reverse Startup Leaderboard"
user_name: "vibe-coding-team"
date: "2026-05-18"
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

- **Identity & Monetization:** Hệ thống tài khoản, lịch sử mua hàng số, tích hợp cổng thanh toán (Stripe).
- **Core Engagement:** Hệ thống đăng bài và bình luận với bộ xác thực Anti-UX (VD: Ad Captcha, độ dài văn bản vô lý). Nút vote có khả năng lẩn tránh (Evasive Button).
- **Gamification:** Tính toán điểm "Wasted Calories" theo thời gian thực và Bảng xếp hạng.
- **Sabotage System:** Triển khai các "Sabotage Packs" theo thời gian thực, làm biến dạng giao diện (CSS overrides) của đối thủ.
- **Moderation:** Dashboard "Anti-Logic" để gán các hình phạt hình ảnh (clown hat).
- **Guardrails:** Kích hoạt "Mercy Threshold" tự động giảm độ khó khi người dùng thất bại liên tục.

**Non-Functional Requirements:**

- **Performance:** TTI < 2.5s, độ trễ WebSockets < 100ms cho các hiệu ứng Sabotage.
- **Security:** Chống XSS nghiêm ngặt khi xử lý Chaos Tokens, Rate limiting, không lưu trữ dữ liệu thẻ tín dụng thô.
- **Scalability:** Hỗ trợ >10,000 kết nối WebSockets đồng thời; auto-scaling hỗ trợ traffic tăng 10 lần trong 3 phút.
- **Accessibility:** Chế độ "Safe-Chaos" ưu tiên `prefers-reduced-motion` và tính năng Bypass cho Screen Reader.

**Scale & Complexity:**
Dự án yêu cầu xử lý logic bất đồng bộ và đồng bộ hóa cao để duy trì sự hỗn loạn có kiểm soát.

- Primary domain: Full-stack Web Application (SPA/SSR) & Real-time Systems
- Complexity level: High
- Estimated architectural components: ~6 (Frontend SPA, SSR Server, WebSocket/PubSub Server, Payment Gateway Integrator, API/Database Layer, LLM/Scoring Queue)

### Technical Constraints & Dependencies

- Bắt buộc sử dụng SSR (như Next.js hoặc Nuxt) để render OG Tags phục vụ cho yếu tố Viral Sharing.
- Yêu cầu xử lý CSS Vanilla thuần cho Design System nhằm đảm bảo hiệu suất tốt nhất khi thao tác thay đổi giao diện thông qua CSS Custom Properties (Chaos Tokens).
- Phụ thuộc vào các dịch vụ thứ ba: Cổng thanh toán (Stripe), Hệ thống Message Queue / Pub-Sub cho WebSockets.

### Cross-Cutting Concerns Identified

- **Real-Time State Synchronization:** Broadcast các sự kiện Sabotage tới tất cả client mà không làm giật lag trình duyệt.
- **Anti-UX Execution vs Performance:** Tách rời logic phức tạp (tính toán khoảng cách của nút Evasive) khỏi rendering UI để giữ tốc độ 60fps.
- **Security vs User-Generated Chaos:** Xác thực an toàn tất cả các yêu cầu sửa đổi CSS để tránh lỗ hổng bảo mật.
- **Accessibility Compliance:** Vượt qua các lỗi UI cố ý đối với các công cụ đọc màn hình.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack Web Application (SPA với SSR) dựa trên phân tích bối cảnh dự án, tập trung vào hiệu suất Real-time và Vanilla CSS.

### Starter Options Considered

- **Next.js (App Router):** Phù hợp nhất nhờ khả năng SSR mạnh mẽ (hỗ trợ OG Tags cho Viral Sharing), quản lý Route linh hoạt và tối ưu hóa hiệu suất tốt. Hỗ trợ dễ dàng việc không sử dụng Tailwind để chuyển sang Vanilla CSS.
- **Nuxt.js:** Một lựa chọn tuyệt vời cho Vue ecosystem, nhưng hệ sinh thái thư viện React (để custom các hook cho Evasive Button) hiện tại phong phú hơn.
- **SaaS Boilerplates (ixartz, MakerKit, v.v.):** Bị loại bỏ vì chúng thường đi kèm với Tailwind CSS (v4) và giao diện đã được dựng sẵn, đi ngược lại với yêu cầu tự xây dựng Custom Design System (Vanilla CSS) cho Anti-UX.

### Selected Starter: Next.js (Official Starter)

**Rationale for Selection:**
Khởi tạo bằng Next.js chính thức cung cấp một kiến trúc vững chắc nhưng đủ trống (barebones) để chúng ta xây dựng hệ thống "Chaos Tokens" (CSS Variables) ở cấp độ `:root` mà không bị xung đột với các class tiện ích của Tailwind. Nó cũng giải quyết trọn vẹn yêu cầu về SSR/SEO (cho việc chia sẻ mạng xã hội) và dễ dàng tích hợp với một server WebSocket/PubSub độc lập.

**Initialization Command:**

```bash
pnpm create next-app apps/frontend --typescript --eslint --app --src-dir --import-alias "@/*"
# (Lưu ý: Bỏ qua Tailwind khi được hỏi hoặc cấu hình không sử dụng Tailwind để tuân thủ UX Spec)
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
Sử dụng TypeScript và Node.js, đảm bảo an toàn kiểu dữ liệu (Type Safety) cho toàn bộ ứng dụng, đặc biệt quan trọng khi truyền tải các cấu trúc dữ liệu Sabotage phức tạp.

**Styling Solution:**
Vanilla CSS (thông qua CSS Modules hoặc Global CSS) tuân thủ nghiêm ngặt UX Specification. Cấu trúc `globals.css` sẽ là nơi chứa các biến Chaos Tokens.

**Build Tooling:**
Webpack/Turbopack được tích hợp sẵn của Next.js giúp tối ưu hóa bundle size, đảm bảo TTI < 2.5s theo yêu cầu.

**Testing Framework:**
Chưa đi kèm mặc định (sẽ cần cài đặt thêm Jest/Playwright sau này để kiểm thử các luồng thao tác Anti-UX).

**Code Organization:**
Sử dụng App Router (`src/app`), giúp phân tách rõ ràng giữa Client Components (dành cho Anti-UX) và Server Components (dành cho Data Fetching và SEO meta tags).

**Development Experience:**
Fast Refresh (Hot Reloading), ESLint được cấu hình sẵn, và Path Aliases (`@/*`) giúp việc import file gọn gàng.

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Lựa chọn Database & Real-time engine (để đảm bảo khả năng Sabotage)
- Phương thức Authentication & Thanh toán
- Quản lý trạng thái Frontend (Frontend State Management cho Anti-UX)

**Important Decisions (Shape Architecture):**

- Cơ sở hạ tầng triển khai (Hosting)
- Cơ chế bảo mật và Rate Limiting

**Deferred Decisions (Post-MVP):**

- Hệ thống chấm điểm "Wasted Calories" bằng AI/LLM (tạm thời sử dụng rule-based tĩnh cho MVP).

### Data Architecture

- **Database & Realtime Engine:** **PostgreSQL (Self-hosted/Managed)** với `NestJS`.
  - _Rationale:_ Supabase cung cấp tính năng Realtime (WebSockets) tích hợp sẵn trên nền PostgreSQL. Điều này cho phép chúng ta broadcast các "Sabotage Packs" ngay lập tức tới tất cả client mà không cần tự duy trì một server WebSocket riêng biệt biệt.
- **ORM:** **Drizzle ORM v0.45.2**.
  - _Rationale:_ Nhẹ, type-safe, và cực kỳ nhanh khi chạy trên Edge (hoàn hảo cho kiến trúc Next.js App Router).

### Authentication & Security

- **Authentication:** **NestJS Custom JWT Auth**.
  - _Rationale:_ Tích hợp liền mạch với cơ sở dữ liệu Supabase, hỗ trợ RLS (Row Level Security) để bảo vệ dữ liệu chống lại việc thao túng điểm số trái phép.
- **Payment Gateway:** **Stripe** với `stripe-node v22.1.1`.
  - _Rationale:_ Đáp ứng hoàn toàn NFR-SE3 (PCI-DSS compliance) cho luồng "1-Click Sabotage".
- **Rate Limiting:** Sử dụng Vercel KV (Redis) kết hợp với Middleware.
  - _Rationale:_ Ngăn chặn DDoS thực sự khi người dùng spam các nút Evasive, bảo vệ hệ thống backend.

### API & Communication Patterns

- **Standard API:** **Next.js Server Actions**.
  - _Rationale:_ Xử lý các thao tác form mutation (đăng bài, submit Ad Captcha) một cách liền mạch và an toàn.
- **Real-Time Communication:** **Socket.io (WebSockets)**.
  - _Rationale:_ Sử dụng Pub/Sub để lắng nghe các event thay đổi "Chaos Tokens" (ví dụ: kích hoạt Blur Pack) và lập tức cập nhật biến CSS ở `:root`.

### Frontend Architecture

- **State Management:** **Zustand v5.0.13**.
  - _Rationale:_ Redux quá nặng và cồng kềnh, Context API dễ gây re-render toàn cục. Zustand cực kỳ nhanh, nhẹ và hoàn hảo để quản lý trạng thái hỗn loạn cục bộ (như khoảng cách né tránh của nút Evasive hay trạng thái Mercy) trước khi đồng bộ lên server.
- **Component Styling:** **Vanilla CSS Variables**.
  - _Rationale:_ Nhắc lại quyết định từ Starter: Truyền trực tiếp các chỉ số tọa độ (X/Y) từ Zustand vào inline CSS Custom Properties để duy trì 60fps khi các phần tử UI di chuyển liên tục.

### Infrastructure & Deployment

- **Frontend Hosting:** **Vercel**.
  - _Rationale:_ Nơi tốt nhất để host Next.js, cung cấp Edge Functions (giúp giảm độ trễ TTFB), tự động tối ưu hình ảnh và tích hợp CI/CD tự động.
- **Backend/DB Hosting:** **Standalone NestJS Server & Managed PostgreSQL**.
  - _Rationale:_ Quản lý trọn gói PostgreSQL và hạ tầng Realtime, giúp chúng ta tập trung toàn lực vào việc lập trình Anti-UX.

### Decision Impact Analysis

**Implementation Sequence:**

1. Khởi tạo dự án Next.js (theo Step 3)
2. Thiết lập NestJS Backend (Database, JWT Auth, và Socket.io)
3. Thiết lập Drizzle ORM và định nghĩa Schema (Users, Posts, Leaderboard)
4. Xây dựng nền tảng Vanilla CSS và Zustand Store cho Chaos Tokens
5. Tích hợp Stripe cho Sabotage Store
6. Triển khai các Component Anti-UX (Evasive Button, Hostile Input)

**Cross-Component Dependencies:**
Luồng thanh toán Stripe phải trigger thành công lệnh update qua API của NestJS Backend, sau đó Backend kích hoạt Socket.io Event đẩy Chaos Tokens tới Frontend Zustand Store để cập nhật UI ngay lập tức.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
Có 5 khu vực chính nơi các AI Agent thường đưa ra quyết định khác nhau nếu không được quy định rõ:

1. Đặt tên (Đặc biệt giữa Database snake_case và TypeScript camelCase).
2. Cấu trúc Server Actions vs API Routes trong Next.js App Router.
3. Tổ chức file và thư mục trong `src/`.
4. Định dạng phản hồi của API/Server Actions.
5. Cập nhật state trong Zustand cho Chaos Tokens.

### Naming Patterns

**Database & ORM (Drizzle) Naming Conventions:**

- **Table names:** Số nhiều, `snake_case` (VD: `users`, `sabotage_packs`).
- **Column names:** `snake_case` trong DB (VD: `wasted_calories`), nhưng Drizzle schema bắt buộc phải map sang `camelCase` cho TypeScript sử dụng (VD: `wastedCalories`).
- **Relations:** Cột Foreign key luôn có hậu tố `_id` (VD: `author_id`).

**API & Server Action Conventions:**

- Vì sử dụng Next.js App Router, ưu tiên **Server Actions** thay vì API Routes cho các tác vụ mutation.
- Tên Server Action phải bắt đầu bằng `action` (VD: `actionDeploySabotage()`, `actionSubmitPost()`).

**Code & File Naming Conventions:**

- **React Components:** `PascalCase` (VD: `EvasiveButton.tsx`).
- **Files/Folders:** `kebab-case` (ngoại trừ tên component file) (VD: `format-date.ts`, `app/leaderboard-view/page.tsx`).
- **Variables/Functions:** `camelCase` (VD: `handleVoteClick`, `isMercyActive`).

### Structure Patterns

**Project Organization (Monorepo & Frontend DDD):**

Dự án được chia thành hai workspace (apps/frontend và apps/backend) quản lý bằng `pnpm`.

Frontend áp dụng cấu trúc Domain-Driven Design (DDD):

- `apps/frontend/src/app/`: Chỉ chứa Next.js Route components.
- `apps/frontend/src/core/`: Chứa các thiết lập nền tảng, HTTP/WS clients, và Zustand stores dùng chung.
- `apps/frontend/src/domains/`: Chứa logic kinh doanh được chia theo domain (anti-ux, leaderboard, sabotage). Mỗi domain chứa các thành phần riêng (components, hooks, types).
- `apps/frontend/src/shared/`: Chứa các UI components dùng chung (UI facade) và utils.

Backend (NestJS) đặt tại `apps/backend/` độc lập hoàn toàn.

### Format Patterns

**API Response Formats (Server Actions):**
Tất cả Server Actions phải trả về một object theo chuẩn thống nhất:

```typescript
type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: { message: string; code?: string };
};
```

**Data Exchange Formats:**

- JSON payload và các biến gửi qua WebSockets phải dùng `camelCase`.
- Dữ liệu thời gian luôn truyền và nhận dưới dạng ISO 8601 string (`YYYY-MM-DDTHH:mm:ss.sssZ`).

### Communication Patterns

**Event System Patterns (Socket.io):**

- Tên sự kiện (Event) qua WebSocket có dạng `noun.verb` (VD: `sabotage.deployed`, `leaderboard.updated`).
- Payload phải luôn đính kèm `targetId` để client biết UI nào cần bị làm biến dạng.

**State Management Patterns (Zustand):**

- Stores được đặt tên theo tính năng: `use[Feature]Store` (VD: `useChaosStore`).
- State mutation functions phải được nhóm vào trong cùng một store (không tách rời actions và state) để dễ dàng quản lý.

### Process Patterns

**Error Handling Patterns:**

- Sử dụng ranh giới lỗi `error.tsx` của Next.js cho các lỗi cấp độ route.
- Lỗi từ Server Action phải trả về dạng object `{ error: { message: "..." } }` thay vì throw Error để client dễ dàng render "Passive-Aggressive Errors" (lỗi mỉa mai).

**Loading State Patterns:**

- Component sử dụng hook `useFormStatus` (từ `react-dom`) hoặc trạng thái `isPending` từ `useTransition` cho các tương tác chờ server. Tránh tạo quá nhiều biến `const [isLoading, setIsLoading]` thủ công.

### Enforcement Guidelines

**All AI Agents MUST:**

- KHÔNG BAO GIỜ sử dụng thư viện UI có sẵn như Tailwind hoặc Material UI cho các Anti-UX component (bắt buộc dùng Vanilla CSS/Modules).
- LUÔN kiểm tra cờ `prefers-reduced-motion` bằng CSS media queries trước khi gán bất kỳ animation rung lắc nào.
- CHỈ sử dụng Server Actions để thay đổi dữ liệu, giữ API routes (`route.ts`) chỉ dùng cho Webhooks (VD: Stripe webhook).

### Pattern Examples

**Good Examples:**

```typescript
// Component: apps/frontend/src/domains/anti-ux/components/EvasiveButton.tsx
// Action: apps/frontend/src/app/actions.ts -> export async function actionSubmitVote()
// State: apps/frontend/src/core/store/useChaosStore.ts
```

**Anti-Patterns (DO NOT DO THIS):**

- Đặt tên file component là `evasive_button.jsx` (Sai định dạng và thiếu TypeScript).
- Gọi trực tiếp `fetch('/api/users', ...)` trên Client Component (Lỗ hổng bảo mật, phải dùng Server Actions hoặc RLS nghiêm ngặt).

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
reverse-startup-leaderboard/
├── pnpm-workspace.yaml         # Pnpm Monorepo Config
├── package.json
├── apps/
│   ├── frontend/               # Next.js App (Frontend DDD)
│   │   ├── package.json
│   │   ├── next.config.mjs
│   │   ├── .env.local          # NestJS API URL, WS URL, Stripe Public Key
│   │   ├── middleware.ts       # Rate Limiting & Auth Session check
│   │   └── src/
│   │       ├── app/            # App Router (Routing Only)
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx
│   │       │   ├── globals.css
│   │       │   ├── actions.ts
│   │       │   └── api/webhooks/stripe/route.ts
│   │       ├── core/           # Nền tảng Frontend
│   │       │   ├── api/        # Fetch & Socket.io Clients
│   │       │   ├── store/      # Zustand Global Stores (Chaos, Mercy)
│   │       │   └── types/      # Global Types
│   │       ├── domains/        # DDD: Logic Nghiệp vụ Frontend
│   │       │   ├── anti-ux/    # Cố ý gây ức chế
│   │       │   │   ├── components/ # EvasiveButton, HostileInput, AdCaptcha
│   │       │   │   └── hooks/
│   │       │   ├── leaderboard/# Hiển thị bảng xếp hạng
│   │       │   │   ├── components/ # LeaderboardGrid
│   │       │   │   └── hooks/
│   │       │   └── sabotage/   # Cửa hàng và hiệu ứng biến dạng
│   │       │       ├── components/ # SabotageCard
│   │       │       └── hooks/
│   │       └── shared/         # Modules dùng chung
│   │           ├── ui/         # Base UI Components (Button, Input)
│   │           └── utils/
│   └── backend/                # NestJS Project (Backend)
│       ├── package.json
│       ├── .env                # DB URL, JWT Secret, Stripe Secret
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── auth/           # JWT & RLS Guardrails
│       │   ├── leaderboard/    # Tính toán điểm và WebSockets
│       │   └── sabotage/       # API xử lý mua Sabotage Packs
│       ├── db/
│       │   ├── schema.ts       # Drizzle Schema
│       │   └── migrations/
│       └── seed.sql            # Mock Data
└── tests/
    ├── e2e/                    # Playwright tests (E2E)
    └── unit/                   # Unit tests
```

### Architectural Boundaries

**API Boundaries:**

- **Client to Server:** Luôn thông qua **Server Actions** đặt tại `apps/frontend/src/app/.../actions.ts` cho các tác vụ thay đổi dữ liệu (mutation).
- **External Webhooks:** API Routes (`apps/frontend/src/app/api/`) chỉ dành riêng cho các dịch vụ bên thứ 3 đẩy dữ liệu về (như Stripe báo thanh toán thành công).

**Component Boundaries:**

- **Anti-UX vs UI:** Components trong `apps/frontend/src/shared/ui/` KHÔNG chứa bất kỳ logic gây ức chế nào. Toàn bộ logic phá hoại UI (chạy trốn, mắng người dùng) phải được giới hạn chặt chẽ trong `apps/frontend/src/domains/anti-ux/components/`. Điều này giúp dễ dàng tái sử dụng UI chuẩn và kiểm soát rủi ro.
- **Client vs Server Components:** Các component trong `anti-ux/` và `store/` luôn là `"use client"` do phụ thuộc vào hệ tọa độ chuột và Zustand. Các danh sách như `LeaderboardGrid.tsx` là Server Components để tối ưu SEO và tốc độ.

**Data Boundaries:**

- Toàn bộ quyền truy cập trực tiếp vào DB phải diễn ra trong Server Components hoặc Server Actions bằng Drizzle (`apps/backend/db/index.ts`). Client Components không bao giờ gọi trực tiếp DB.

### Requirements to Structure Mapping

**Feature/Epic Mapping:**

- **Core Engagement (Đăng bài/Bình luận):**
  - Giao diện: `apps/frontend/src/app/post/create/page.tsx`
  - Chướng ngại vật: `apps/frontend/src/domains/anti-ux/components/HostileInput.tsx`, `AdCaptchaModal.tsx`
  - Xử lý dữ liệu: Server Actions trong trang đó.
- **Sabotage System (Cửa hàng Trol Capitalism):**
  - Giao diện: `apps/frontend/src/app/sabotage-store/page.tsx`
  - Xử lý thanh toán: `apps/backend/src/sabotage/sabotage.controller.ts` (Webhook)
  - Đồng bộ Realtime: `apps/frontend/src/core/api/socket.client.ts` (lắng nghe broadcast)

**Cross-Cutting Concerns:**

- **Chaos Tokens (Visual Distortions):**
  - Quản lý trạng thái: `apps/frontend/src/core/store/useChaosStore.ts`
  - Áp dụng vào DOM: `apps/frontend/src/app/layout.tsx` (inject CSS variables vào thẻ `<body>`).

### Integration Points

**Internal Communication:**

- Khi người dùng Vote thành công -> Gọi Server Action -> Update DB -> Trả về kết quả -> Component cập nhật UI.
- Quản lý thất bại: Component `EvasiveButton` thất bại liên tục -> Gọi action trong `apps/frontend/src/core/store/useMercyStore.ts` -> Nếu đạt ngưỡng -> Bật chế độ Mercy (Vô hiệu hóa evasion logic).

**External Integrations:**

- **Stripe:** Xử lý luồng checkout từ client, sau đó Stripe gọi về Webhook của chúng ta để xác nhận thanh toán.
- **Socket.io:** Client subscribe vào `leaderboard` channel để nhận thông báo ngay lập tức khi một `SabotagePack` được mua và áp dụng.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
Toàn bộ các quyết định công nghệ (Next.js App Router, Socket.io, Drizzle ORM, Zustand) hoạt động tương thích hoàn hảo. Socket.io giải quyết gọn gàng nhu cầu WebSocket mà không xung đột với mô hình SSR của Next.js. Vanilla CSS biến `:root` kết hợp với Zustand đảm bảo hiệu năng 60fps cho các component Anti-UX.

**Pattern Consistency:**
Các quy tắc về việc sử dụng `snake_case` (DB) map sang `camelCase` (TS), và bắt buộc dùng Server Actions cho các mutations (thay đổi dữ liệu) tạo ra ranh giới rõ ràng, dễ đoán cho mọi AI Agent.

**Structure Alignment:**
Cấu trúc thư mục tách biệt rõ ràng giữa `domains/anti-ux` và `shared/ui` giúp ngăn chặn việc vô tình áp dụng logic "cố ý làm phiền" vào các thành phần thông thường, đảm bảo khả năng bảo trì.

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**

- **Sabotage Store / Monetization:** Được hỗ trợ qua Stripe API Webhooks và Socket.io.
- **Leaderboard / Wasted Calories:** Được hỗ trợ thông qua Drizzle ORM và thuật toán tính điểm tích hợp trong Next.js Server Actions.
- **Anti-UX Core:** Được xử lý an toàn tại Client Components thông qua Zustand state và Vanilla CSS.

**Functional Requirements Coverage:**
Tất cả 6 nhóm FR (từ Identity đến Guardrails) đều được map vào một component hoặc cấu trúc dữ liệu cụ thể. "Mercy Threshold" được đảm bảo thông qua `useMercyStore.ts`.

**Non-Functional Requirements Coverage:**

- **NFR-PE1 (TTI < 2.5s):** Được giải quyết bằng Next.js SSR và Edge caching.
- **NFR-SE1 (Security):** Server Actions và Guardrails và xác thực JWT trên NestJS ngăn chặn thao túng điểm số.
- **NFR-AC1 (Accessibility/Safe-Chaos):** Quy tắc CSS `prefers-reduced-motion` được đưa vào Enforcement Guidelines cho các AI Agent.

### Implementation Readiness Validation ✅

**Decision Completeness:**
Các thư viện cốt lõi đều được chốt phiên bản cụ thể (`NestJS`, `drizzle-orm v0.45.2`, `zustand v5.0.13`) để tránh đứt gãy do thay đổi API.

**Structure Completeness:**
Cây thư mục đã vạch ra vị trí cụ thể của từng loại component, store, và webhook.

**Pattern Completeness:**
Quy ước đặt tên (Naming), xử lý lỗi (Error Handling), và quy trình gọi dữ liệu (Server Actions) được định nghĩa đầy đủ để AI Agent làm theo.

### Gap Analysis Results

- **Minor Gap (Mức độ Thấp):** Thuật toán tính điểm "Wasted Calories" bằng LLM/AI chưa có thiết kế kiến trúc chi tiết (Deferred post-MVP). Điều này không ngăn cản việc code bản MVP với rule-based logic.
- **Minor Gap (Mức độ Thấp):** CI/CD Pipeline (GitHub Actions) chưa được viết script cụ thể, nhưng có thể giao phó hoàn toàn cho Vercel trong giai đoạn đầu.

### Validation Issues Addressed

Không có vấn đề (Issue) nghiêm trọng nào làm gián đoạn việc phát triển. Mọi xung đột rủi ro cao (chẳng hạn như làm sao để UI giật lag mà không treo trình duyệt) đã được giải quyết bằng phương pháp tách bạch DOM Rendering và CSS Variables.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**

- Tách biệt rõ ràng giữa logic giao diện thông thường và giao diện "phá hoại" (Anti-UX).
- Tận dụng tối đa hệ sinh thái Next.js App Router kết hợp với backend NestJS độc lập để xử lý các logic phức tạp.
- Hiệu năng được đưa lên hàng đầu với Vanilla CSS thay vì các thư viện CSS-in-JS nặng nề.

**Areas for Future Enhancement:**

- Thêm Redis hoặc Memcached độc lập nếu Vercel KV vượt quá giới hạn băng thông trong tương lai.
- Thiết kế hệ thống queue background cho LLM Scoring.

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**

```bash
pnpm create next-app apps/frontend --typescript --eslint --app --src-dir --import-alias "@/*"
```

(Và nhớ KHÔNG chọn Tailwind CSS)
