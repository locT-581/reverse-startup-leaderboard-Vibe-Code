# 📉 Reverse Startup Leaderboard

> **Sảnh Đường Kém Hiệu Quả** — Nơi tôn vinh những tech stack phức tạp nhất, những lần xoay trục (pivot) không có doanh thu, và các pipeline được overengineer quá mức. Một dự án châm biếm dành riêng cho những nhà đổi mới công nghệ từ chối ra mắt sản phẩm thực tế!

[![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%2B%20NestJS-brightgreen)](#%EF%B8%8F-kiến-trúc-hệ-thống--công-nghệ)
[![Monorepo](https://img.shields.io/badge/Monorepo-pnpm%20workspaces-blue)](#%EF%B8%8F-kiến-trúc-hệ-thống--công-nghệ)
[![Stripe](https://img.shields.io/badge/Monetization-Stripe%20%28Mockable%29-indigo)](#-hệ-thống-phá-hoại-thời-gian-thực)
[![Real-time](https://img.shields.io/badge/Real--time-Socket.io-orange)](#-hệ-thống-phá-hoại-thời-gian-thực)

---

## 💡 Ý tưởng Dự án

Khác với các bảng xếp hạng khởi nghiệp thông thường (như Product Hunt hay Indie Hackers) nơi các sản phẩm được đánh giá dựa trên doanh thu và lượt upvote hữu ích, **Reverse Startup Leaderboard** là một bảng xếp hạng đảo ngược độc đáo:

- **Mục tiêu:** Leo lên đỉnh bảng xếp hạng bằng cách tạo ra các bài viết thuyết trình (pitch) tiêu tốn nhiều **"Calo lãng phí" (Wasted Calories)** nhất có thể.
- **Tiêu chí:** Tech stack càng cồng kềnh, cấu trúc microservices càng phân rã một cách vô lý, sử dụng càng nhiều thuật ngữ doanh nghiệp sáo rỗng (buzzwords), bạn càng có cơ hội dẫn đầu bảng xếp hạng.
- **Tính năng tương tác độc hại:** Người dùng khác có thể mua các gói phá hoại bằng tiền thật (hoặc tiền giả lập) để phá rối giao diện bài đăng của bạn hoặc kéo tụt thứ hạng của bạn trong thời gian thực!

---

## ⚙️ Cơ chế & Quy tắc Châm biếm

Hệ thống được vận hành bởi một bộ quy tắc nghiêm ngặt được định nghĩa trong mã nguồn nhằm duy trì mức độ "synergy" cao nhất.

### 1. Cách tính điểm Calo Lãng Phí (Wasted Calories)
Mỗi bài viết ([posts](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/db/schema.ts#L17-L27)) và bình luận ([comments](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/db/schema.ts#L42-L54)) sẽ được tự động chấm điểm thông qua hàm [calculateScoreHelper](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/src/leaderboard/leaderboard.service.ts#L24-L75):

| Hành động / Định dạng | Tác động điểm số (Calories) | Chi tiết |
| :--- | :---: | :--- |
| **Độ dài từ ngữ** | `+5` calo mỗi từ | Viết càng dài dòng văn tự càng tốt. |
| **Scream-Caps (VIẾT HOA)** | `+50` calo | Kích hoạt nếu > 30% ký tự chữ cái là chữ IN HOA (gào thét). |
| **Over-engineering** | `+100` calo | Chứa các khối mã Markdown (\`\`\`) mô tả cấu trúc hệ thống cồng kềnh. |
| **Độ dài bài viết cực đại** | `+150` calo | Bài viết có độ dài trên 1000 ký tự. |
| **Độ dài bài viết cực tiểu** | `-50` calo | Trừng phạt bài viết dưới 100 ký tự (quá ngắn, quá dễ hiểu). |
| **Dấu câu ức chế** | `+5` calo mỗi ký tự | Mỗi lần xuất hiện của `!`, `?`, hoặc `...` (giới hạn tối đa `+50` calo). |

### 2. Bộ lọc Synergy nghiêm ngặt
Để xuất bản bài đăng, bạn phải tuân thủ các điều kiện sau trong [PostsService](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/src/posts/posts.service.ts#L48-L85):
- **Tiêu đề bài viết:** Phải từ 10 ký tự trở lên và chứa ít nhất **2 thuật ngữ chuyên môn (buzzwords)**. Nếu không, hệ thống sẽ trả về lỗi: *"Your title lacks sufficient synergy. Please leverage additional paradigms."*
- **Nội dung bài viết:** Phải từ 50 ký tự trở lên và chứa ít nhất **3 thuật ngữ chuyên môn**. Nếu không, bạn sẽ nhận được thông báo lỗi: *"This explanation is dangerously legible. Inject more synergy."*
- **Bình luận:** Nội dung bình luận **bắt buộc phải dài hơn nội dung bài viết gốc**. Nếu ngắn hơn, hệ thống sẽ từ chối: *"Your solution has insufficient volume. It must strictly exceed the original post's length."*

> 📌 **Danh sách Buzzwords hợp lệ:** `synergy`, `paradigm`, `bandwidth`, `leverage`, `monetize`, `disruptive`, `deliverables`, `kpi`, `okr`, `cloud-native`, `game-changer`, `circle back`, `touch base`, `low-hanging fruit`, `deep dive`, `microservices`, `ecosystem`, `scalability`, `scale`, `pivoting`, `pivot`.

### 3. Hệ thống Báo cáo Vi phạm Logic (Logic Violations)
Nếu bạn đăng một bài viết quá thực tế, hữu ích hoặc hợp lý, những người dùng khác có thể báo cáo bạn vì **"Vi phạm logic"** thông qua [reportPost](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/src/posts/posts.service.ts#L214-L289).
- Nếu tự báo cáo chính mình: Hệ thống báo lỗi *"Why are you reporting yourself? That's too logical, stop it!"*
- Khi một tài khoản tích lũy đủ **5 vi phạm logic trở lên**, họ sẽ bị phạt **Đội Mũ Hề (Clown Hat 🤡)**. Avatar của họ trên bảng xếp hạng sẽ hiển thị biểu tượng chú hề kèm dòng chữ cảnh báo.

---

## 😈 Hệ thống Phá hoại thời gian thực (Sabotage Store)

Đây là tính năng cốt lõi giúp kéo tụt hoặc biến dạng bài viết của đối thủ cạnh tranh trên bảng xếp hạng nhằm giữ vững vị trí độc tôn của bạn. Các thao tác mua bán được xử lý thông qua [SabotageService](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/src/sabotage/sabotage.service.ts).

### Các gói phá hoại có sẵn:
1. **Gói Làm mờ (Blur Pack - $0.99):** Khi áp dụng lên bài đăng mục tiêu, nó sẽ làm mờ toàn bộ chữ của bài đăng đó trên giao diện của mọi người xem, đồng thời trừ đi `100` calo của bài đăng đó.
2. **Gói Comic Sans ($1.99):** Bắt buộc bài đăng của đối thủ hiển thị bằng phông chữ Comic Sans, tước bỏ hoàn toàn vẻ chuyên nghiệp của họ, đồng thời trừ đi `150` calo.
3. **Gói Papyrus ($1.99):** Bắt buộc bài đăng của đối thủ hiển thị bằng phông chữ Papyrus mang phong cách cổ đại hỗn loạn, đồng thời trừ đi `150` calo.
4. **Gói Trừ Calo ($4.99):** Trực tiếp khấu trừ `500` calo lãng phí từ bài viết của đối thủ, kéo sụt vị trí xếp hạng của họ ngay lập tức.

### Tích hợp Stripe & Chế độ Giả lập (Mock Mode)
Hệ thống tích hợp Stripe để xử lý giao dịch. Tuy nhiên, để phát triển nhanh chóng mà không cần thiết lập tài khoản Stripe thật:
- Nếu biến môi trường `STRIPE_SECRET_KEY` trống hoặc bắt đầu bằng `sk_test_mock`, hệ thống sẽ kích hoạt **Stripe Mock Mode** trong [StripeService](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/src/sabotage/stripe.service.ts#L10-L21).
- Trong chế độ này, việc tạo phiên thanh toán sẽ trả về một đường link giả lập, và giao dịch sẽ tự động được hoàn thành (auto-fulfillment) ngay lập tức mà không cần trừ tiền thật.

---

## 🛡️ Thiết kế Hostile UX & Chế độ Khoan dung (Mercy Mode)

Để tăng thêm phần ức chế châm biếm, dự án triển khai các mẫu thiết kế gây khó chịu cho người dùng (Hostile UX / Anti-UX) được đặt riêng trong thư mục [anti-ux](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/anti-ux/):

### 1. Nút bình chọn lẩn trốn (Evasive Button)
Nút bấm bình chọn [EvasiveButton.tsx](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/anti-ux/components/EvasiveButton.tsx) được tích hợp công nghệ "chạy trốn":
- **Hành vi chuột:** Khi con trỏ chuột tiến lại gần trong bán kính 50px, nút bấm sẽ tự động tính toán góc di chuyển và dịch chuyển ngẫu nhiên sang hướng khác để trốn tránh.
- **Hành vi cảm ứng:** Trên thiết bị di động, mỗi lần chạm vào nút sẽ kích hoạt dịch chuyển ngẫu nhiên.
- **Cách vượt qua:** Bạn phải di chuyển chuột cực nhanh để nhấp chuột liên tục **5 lần liên tiếp (Combo)** trong vòng 2 giây khi nút bắt đầu rung lắc (`vibrating` state). Hoặc bạn có thể sử dụng phím `Tab` để lấy tiêu điểm và nhấn `Enter`/`Space` (hệ thống sẽ phát hiện người dùng bàn phím và vô hiệu hóa cơ chế trốn tránh).
- **Phần thưởng:** Khi bấm thành công, còi hơi (Airhorn) giả lập sẽ vang lên, màn hình rung chuyển và pháo hoa giấy bay rực rỡ!

### 2. Xác minh thông điệp quảng cáo tài trợ (Ad Captcha)
Khi gửi bài viết, một modal [AdCaptchaModal.tsx](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx) sẽ hiện lên:
- Bạn buộc phải sao chép **chính xác từng ký tự (phân biệt chữ hoa/thường)** của một thông điệp quảng cáo sáo rỗng được tài trợ.
- Nếu bạn bấm nút "Bỏ qua quảng cáo", nút bấm sẽ trốn tránh con trỏ chuột của bạn. Nếu bạn dùng bàn phím để kích hoạt bỏ qua quảng cáo, nó sẽ chỉ chuyển sang hiển thị một quảng cáo mới dài hơn và bắt bạn nhập lại từ đầu!

### 3. Chế độ Khoan dung (Mercy Mode / Baby Mode 👶)
Nếu bạn liên tục thất bại khi tương tác với Nút trốn tránh hoặc Nhập sai quảng cáo, hệ thống sẽ ghi nhận các lượt thất bại này vào cơ sở dữ liệu (`mercy_failures` trong bảng `users`).
- Khi số lần thất bại vượt quá ngưỡng quy định, hệ thống sẽ kích hoạt **Chế độ Khoan dung (Mercy Mode)**.
- Khi hoạt động, một hộp thoại chào mừng [MercyActivationModal.tsx](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/anti-ux/components/MercyActivationModal.tsx) sẽ hiển thị và vô hiệu hóa tất cả các hành vi Anti-UX trên. Bạn sẽ có biểu tượng em bé 👶 cạnh tên của mình và có thể đăng bài/bình chọn một cách bình yên.

---

## ♿ Giao thức Chaos An toàn (Safe Chaos Protocol)

Mặc dù giao diện cực kỳ hỗn loạn và sinh động, dự án vẫn đảm bảo khả năng tiếp cận và tuân thủ các nguyên tắc thiết kế web:
- **Hỗ trợ Reduced Motion:** Hệ thống tự động lắng nghe media query `@media (prefers-reduced-motion: reduce)`. Nếu người dùng bật cấu hình giảm chuyển động trong hệ điều hành, toàn bộ cơ chế nút chạy trốn và các hoạt ảnh rung lắc màn hình mạnh sẽ được tắt hoàn toàn để bảo vệ người dùng bị rối loạn tiền đình.
- **Khả năng điều hướng bằng bàn phím:** Người dùng khiếm thị có thể sử dụng phím `Tab` và Screen Reader bình thường. Các cơ chế trốn tránh sẽ tự động nhường bước khi phát hiện tiêu điểm bàn phím, đảm bảo khả năng tương thích khả dụng 100%.

---

## 🛠️ Kiến trúc Hệ thống & Công nghệ

Dự án được cấu trúc dưới dạng một Monorepo sử dụng **pnpm workspaces**:

```
reverse-startup-leaderboard/
├── apps/
│   ├── frontend/         # Next.js (React 19, Zustand, Socket.io-client, Vanilla CSS Modules)
│   └── backend/          # NestJS (REST API, WebSockets Gateway, Drizzle ORM, Stripe integration)
├── db/                   # Thư mục chứa schema cơ sở dữ liệu và seed dữ liệu của backend
├── drizzle/              # Các file schema tự động sinh ra bởi Drizzle-Kit
├── tests/
│   ├── e2e/              # Playwright End-to-End Tests
│   └── unit/             # Jest Unit Tests
├── docker-compose.yml    # Khởi chạy PostgreSQL database cục bộ
├── package.json          # Cấu hình scripts monorepo chung
└── pnpm-workspace.yaml   # Cấu hình không gian làm việc của pnpm
```

- **Quản lý trạng thái Client:** Sử dụng [Zustand](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/package.json#L17) phục vụ cập nhật trạng thái UX, Auth và Mercy Mode.
- **Truyền thông Real-time:** Kết nối Socket.io kết nối trực tiếp client-server để đồng bộ hóa bảng xếp hạng tức thời và phát tán các hiệu ứng phá hoại (blur, font chữ) lên màn hình người dùng khác ngay khi đối thủ bị phá hoại.
- **ORM & DB:** Drizzle ORM kết nối với PostgreSQL Database.

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Chuẩn bị môi trường
Hãy đảm bảo bạn đã cài đặt:
- **Node.js** (Phiên bản v20 trở lên)
- **pnpm** (Trình quản lý gói bắt buộc của monorepo)
- **Docker** (Để chạy PostgreSQL database)

### 2. Cài đặt các thư viện phụ thuộc
Tại thư mục gốc của dự án, chạy lệnh:
```bash
pnpm install
```

### 3. Khởi chạy Cơ sở dữ liệu (PostgreSQL)
Khởi chạy container PostgreSQL thông qua file [docker-compose.yml](file:///Users/loct-581/Work/reverse-startup-leaderboard/docker-compose.yml):
```bash
docker compose up -d
```

### 4. Thiết lập Biến môi trường
Cấu hình biến môi trường bằng cách sao chép các file mẫu:
- **Backend:** Kiểm tra file `.env` trong thư mục [apps/backend/](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/backend/)
  - Đảm bảo `DATABASE_URL` trỏ đúng vào cơ sở dữ liệu PostgreSQL cục bộ (mặc định: `postgresql://postgres:postgres@localhost:5432/reverse_startup`).
  - Để chạy chế độ thanh toán giả lập, hãy để trống hoặc đặt `STRIPE_SECRET_KEY=sk_test_mock`.
- **Frontend:** Kiểm tra file `.env.local` trong thư mục [apps/frontend/](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/)
  - Kiểm tra `NEXT_PUBLIC_BACKEND_URL` trỏ đúng về cổng của NestJS (mặc định: `http://localhost:3001`).

### 5. Tạo bảng & Seed dữ liệu giả lập
Đẩy cấu hình schema Drizzle vào PostgreSQL và tiến hành nạp dữ liệu mẫu:
```bash
# Di chuyển vào thư mục backend
cd apps/backend

# Đồng bộ hóa cấu trúc database
npx drizzle-kit push

# Tạo dữ liệu mock ban đầu (Các gói phá hoại, người dùng mẫu, bài đăng mẫu)
pnpm db:seed
```

### 6. Chạy dự án ở chế độ Phát triển
Tại thư mục gốc của dự án, khởi chạy đồng thời cả Frontend và Backend bằng lệnh:
```bash
pnpm dev
```
- **Frontend** sẽ chạy tại địa chỉ: [http://localhost:3000](http://localhost:3000)
- **Backend API Server** sẽ chạy tại địa chỉ: [http://localhost:3001](http://localhost:3001)

---

## 🧪 Hướng dẫn chạy Thử nghiệm (Testing)

Dự án cung cấp bộ kiểm thử đầy đủ để đảm bảo các tương tác hỗn loạn hoạt động ổn định:

### Chạy Unit Tests (Jest)
Kiểm tra các hàm tính toán Calo lãng phí và các logic nghiệp vụ backend:
```bash
pnpm test
```

### Chạy End-to-End Tests (Playwright)
Kiểm tra toàn bộ luồng tương tác, bao gồm cơ chế trốn tránh của nút bấm và ngưỡng kích hoạt Mercy Mode:
```bash
npx playwright test
```
*Lưu ý: Playwright được cấu hình trong [playwright.config.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/playwright.config.ts) để tự động khởi chạy các máy chủ frontend/backend giả lập trên môi trường test.*

---

## 📈 Lộ trình phát triển & Hoàn thành (Sprint Status)
Dự án được triển khai toàn diện qua 4 giai đoạn Epic chính, tất cả đều đã được phát triển hoàn tất:
- [x] **Epic 1: Khởi tạo & Giao diện Nền tảng** (Next.js & NestJS, Auth, Bảng xếp hạng cơ bản).
- [x] **Epic 2: Tích hợp Hostile UX** (Captcha quảng cáo, Nút lẩn tránh, Chế độ Khoan dung).
- [x] **Epic 3: Cửa hàng Phá hoại thời gian thực** (Mua gói phá hoại, Stripe Checkout Mock, Broadcast Socket.io).
- [x] **Epic 4: Hệ thống Báo cáo & Tuân thủ** (Báo cáo vi phạm logic, phạt Mũ hề, Giao thức Reduced Motion).

Thông tin chi tiết về tiến độ có thể tham khảo tại file trạng thái [sprint-status.yaml](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/implementation-artifacts/sprint-status.yaml).

---
*Chúc bạn có những trải nghiệm overengineer tuyệt vời và hạ bệ thành công đối thủ trên bảng xếp hạng lãng phí calo!* 📉🤡👶
