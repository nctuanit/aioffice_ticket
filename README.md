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

Access token giữ trong bộ nhớ, refresh token trong `sessionStorage` (`ticket-hub.refresh-token`), tự làm mới khi 401 qua hàng đợi refresh. Hub chạy trên origin riêng nên không dùng cookie HttpOnly của backend; nếu sau này thêm origin Hub vào `authCookie.allowedOrigins` của open-office thì có thể chuyển sang cookie.

## Lộ trình

- P5 (hiện tại): scaffold, auth, layout, deploy.
- P6: hàng đợi (bảng, bộ lọc, đếm ngược 48h, polling 30 s), chi tiết + trả lời / ghi chú nội bộ, nhận xử lý / phân công / trạng thái, tổng quan, màn lịch làm việc.
