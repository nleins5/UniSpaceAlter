# UniSpace

UniSpace là công cụ thiết kế áo lớp trực tuyến, giúp học sinh và nhóm có thể tự tạo thiết kế áo ngay trên trình duyệt rồi đặt hàng luôn mà không cần qua bên thứ ba.

---

## Tính năng chính

- **Trình biên tập canvas**: Kéo thả hình ảnh lên mặt trước/sau của áo, chỉnh vị trí, kích thước và góc xoay tự do.
- **Công cụ chữ**: Thêm text, chọn font, cỡ chữ và màu sắc trực tiếp trên áo.
- **Màu áo**: Chọn từ bảng màu, hỗ trợ các kiểu áo khác nhau (thun, raglan, polo).
- **Tạo ảnh bằng AI**: Mô tả thiết kế bằng tiếng Việt, Gemini sẽ tạo ảnh sẵn sàng để dán lên áo.
- **Đặt hàng**: Điền thông tin, chụp ảnh thiết kế và gửi đơn — tất cả trong một luồng.
- **Trang nhà sản xuất**: Người nhận đơn xem toàn bộ thông tin và thiết kế tại đường dẫn riêng.
- **Dashboard quản lý**: Theo dõi và cập nhật trạng thái đơn hàng.

---

## Tech stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**
- **Tailwind CSS v4**
- **Google Gemini API** — tạo ảnh AI và hỗ trợ thiết kế
- **html2canvas-pro** — chụp canvas thành ảnh PNG khi đặt hàng

Dữ liệu đơn hàng mặc định lưu trong bộ nhớ server (in-memory). Nếu cấu hình Supabase thì sẽ tự động chuyển sang lưu database + storage.

---

## Chạy local

```bash
git clone https://github.com/nleins5/unispace.git
cd unispace

npm install

cp .env.example .env.local
# Mở .env.local và điền GEMINI_API_KEY

npm run dev
```

Truy cập tại http://localhost:3000

---

## Biến môi trường

Bắt buộc:

```
GEMINI_API_KEY=your_key_here
```

Tùy chọn — nếu muốn dùng Supabase thay vì in-memory:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Lấy Gemini API key tại: https://aistudio.google.com/apikey

---

## Cấu trúc thư mục

```
src/app/
  page.tsx                  Landing page
  design/page.tsx           Canvas editor + AI chat
  order/page.tsx            Form đặt hàng
  dashboard/page.tsx        Quản lý đơn (admin)
  manufacturer/[id]/        Xem đơn + thiết kế (nhà sản xuất)
  api/
    generate/               Gemini AI tạo ảnh
    orders/                 CRUD đơn hàng
    auth/                   Đăng nhập / đăng xuất

src/lib/
  authService.ts            Quản lý session phía server
  orderService.ts           Logic đơn hàng (Supabase + in-memory fallback)
  supabase.ts               Khởi tạo Supabase client

public/mockups/             Vector mockup áo (SVG/PNG)
orders/                     Thư mục đơn hàng — bị gitignore, không commit lên
```

---

## Luồng hoạt động

```
Khách vào /design → thiết kế áo → qua /order điền thông tin → đặt hàng
                                                                    |
Admin vào /dashboard → xem danh sách → mở /manufacturer/{id} để xem thiết kế + thông tin khách
```

---

## License

MIT © 2026 UniSpace
