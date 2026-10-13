# Ticket Hub

Web xử lý ticket hỗ trợ của AI SUPER OFFICE, dành cho vai trò **support** và **admin**. Khách tạo ticket từ app Electron / web admin; đội hỗ trợ nhận, trả lời, đổi trạng thái và theo dõi hạn **48 giờ làm việc** tại đây.

Backend là `open-office` (NestJS). Hub không có backend riêng.

## Chạy local

```bash
bun install
cp .env.example .env            # VITE_API_URL=http://localhost:4901/api
bun run dev                     # http://localhost:5180
```

Đăng nhập bằng tài khoản open-office có role `admin` hoặc `support` (`POST /api/auth/login`, provider `local`). Tài khoản khác đăng nhập được nhưng bị chặn ở màn "Không có quyền truy cập".

## Lệnh

| Lệnh | Việc |
|---|---|
| `bun run dev` | Vite dev server (port 5180) |
| `bun run typecheck` | `tsc -b` |
| `bun run lint` | ESLint |
| `bun run build` | typecheck + `vite build` → `dist/` |
| `bun run deploy` | build + `wrangler deploy` (Cloudflare Workers static assets, `*.workers.dev` khi chưa có domain) |

Khi deploy, đặt `VITE_API_URL=https://office.dev4fun.vn/api` trong `.env.production`.

## Cấu trúc

```
src/
  app/            App, RootLayout, providers (TanStack Query, sonner)
  config/env.ts   VITE_API_URL
  lib/            axios + auth (token manager, refresh queue, interceptor) — chép từ open-office-fe
  i18n/           i18next, vi mặc định + en, namespace common / auth / tickets
  features/auth/  đăng nhập, phiên, route guard (admin | support)
  features/tickets/ hằng số, zod schema, API client staff, trang hàng đợi / chi tiết / tổng quan / lịch
  layouts/        AuthLayout, HubShellLayout (sidebar + topbar)
  routes/         TanStack Router code-based
  components/ui/  shadcn (new-york, Tailwind v4 tokens trong styles/globals.css)
```

## Phiên đăng nhập

Access token giữ trong bộ nhớ, refresh token trong `sessionStorage` (`ticket-hub.refresh-token`), tự làm mới khi 401 qua hàng đợi refresh. Hub không dùng cookie HttpOnly của backend.

## CORS phía backend (bắt buộc khi deploy)

open-office chỉ cho phép các origin trong `AUTH_COOKIE_ALLOWED_ORIGINS` (nếu trống thì lấy `WEB_APP_ORIGIN`). Phải thêm origin của Hub vào biến này trên server, ví dụ `AUTH_COOKIE_ALLOWED_ORIGINS=https://<web-app>,https://<ticket-hub>`; nếu không, mọi request của Hub bị chặn ở preflight. Khi chạy local cùng backend dev: thêm `http://localhost:5180`.

## Màn hình

- **Tổng quan** (`/dashboard`): số ticket mới / chưa ai nhận / sắp hết hạn / chờ khách / hết hạn 7 ngày, phân bổ theo trạng thái và ứng dụng, danh sách sắp hết hạn tiếp nhận.
- **Hàng đợi** (`/tickets`): bộ lọc trên URL (trạng thái, người xử lý, ứng dụng, danh mục, ưu tiên, nguồn, tìm kiếm), hai chế độ xem:
  - **Danh sách**: bảng (điện thoại: thẻ), đếm ngược 48 giờ làm việc, phân trang, polling 30 s.
  - **Kanban** (`?view=board`): một cột cho mỗi trạng thái đang hoạt động; kéo thẻ (chuột / cảm ứng) hoặc dùng menu ⋯ "Chuyển sang" (bàn phím) để đổi trạng thái. Chỉ cột hợp lệ theo bảng chuyển trạng thái của staff nhận thẻ; Đã giải quyết / Đã đóng / Hủy cần xác nhận và có thể kèm lời nhắn cho khách. Kéo Mới → Đang xử lý với ticket chưa ai nhận sẽ tự nhận cho người kéo. Cập nhật lạc quan, trả thẻ về chỗ cũ khi backend trả 409. Bấm thẻ mở chi tiết ở panel bên phải.
- **Chi tiết** (`/tickets/:id`): hội thoại (ghi chú nội bộ nền vàng có nhãn), trả lời khách / ghi chú nội bộ (Ctrl + Enter), nhận xử lý, đổi trạng thái / ưu tiên, phân công (admin) hoặc bỏ nhận (support), thông tin và lịch sử.
- **Lịch làm việc** (`/settings/calendar`, chỉ admin): ngày làm việc trong tuần và ngày lễ dùng để tính hạn 48 giờ.

- **Người theo dõi** (P4b): gắn nhiều admin / support vào một ticket để theo dõi / cùng xử lý (khác người xử lý chính). Avatar xếp chồng trên thẻ Kanban và dòng danh sách; ô tìm-và-gắn trong panel xử lý; bộ lọc "Gắn tôi theo dõi" (`?participant=me`); gõ `@tên` hoặc `@phần-trước-@-email` trong ghi chú nội bộ cũng tự gắn. Khách không bao giờ thấy danh sách này.
