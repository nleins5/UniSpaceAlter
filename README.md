# UniSpace — Trạm Đồng Phục AI

> Thiết kế áo lớp trực tuyến với AI · Kéo thả · Đặt hàng ngay

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google)](https://ai.google.dev)

---

## ✨ Tính năng

| Tính năng | Mô tả |
|-----------|-------|
| 🤖 **AI Design** | Nhập mô tả → Gemini AI tạo thiết kế SVG/ảnh sẵn sàng in |
| 🎨 **Canvas Editor** | Kéo thả hình ảnh lên áo, chỉnh vị trí, xoay, resize |
| 🖊️ **Text Tool** | Thêm chữ, chọn font, cỡ chữ, 70+ màu sắc |
| 👕 **Màu áo** | 80 màu chia theo bảng Material Design |
| 📱 **Responsive** | Hoạt động trên cả mobile & desktop |
| 📦 **Đặt hàng** | Form đặt hàng, chụp ảnh thiết kế, lưu đơn tự động |
| 🏭 **Manufacturer View** | Người bán xem thiết kế + thông tin KH tại `/manufacturer/{orderId}` |
| 📊 **Dashboard** | Quản lý đơn hàng, cập nhật trạng thái |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + Custom CSS
- **AI:** Google Gemini API (gemini-2.0-flash, gemini-2.5-flash)
- **Canvas capture:** html2canvas-pro
- **Storage:** File system (`/orders/{orderId}/`)

---

## 🚀 Chạy local

```bash
# Clone repo
git clone https://github.com/nleins5/unispace.git
cd unispace

# Cài dependencies
npm install

# Tạo file .env.local
cp .env.example .env.local
# Điền GEMINI_API_KEY vào .env.local

# Chạy dev server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

---

## 🔑 Biến môi trường

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Lấy API key tại: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

---

## 📁 Cấu trúc thư mục

```
src/app/
├── page.tsx              # Landing page
├── design/page.tsx       # Canvas editor + AI chat
├── order/page.tsx        # Form đặt hàng
├── dashboard/page.tsx    # Quản lý đơn (admin)
├── manufacturer/[id]/    # Xem đơn + thiết kế (nhà sản xuất)
└── api/
    ├── generate/         # Gemini AI image generation
    ├── orders/           # CRUD đơn hàng
    └── auth/             # Login/logout

orders/                   # Đơn hàng lưu tại đây (gitignored)
├── ORD-{timestamp}/
│   ├── order.json
│   ├── front_design.png
│   └── back_design.png
```

---

## 📱 Luồng hoạt động

```
Khách → /design (vẽ áo + AI) → /order (điền thông tin) → Đặt hàng
                                                              ↓
Người bán → /dashboard → /manufacturer/{orderId} (xem thiết kế + thông tin)
```

---

## 📄 License

MIT © 2026 UniSpace — Trạm Đồng Phục
