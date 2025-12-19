# 🚀 Frontend Development Guide - Docker

## 📋 Yêu Cầu

- **Docker Desktop**: Đã cài đặt và đang chạy
- **Node.js**: 20+ (nếu chạy local)
- **Git**: Đã cài đặt

## 🏗️ Kiến Trúc Dự Án

```
front-end/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   └── ui/         # UI components (shadcn/ui)
│   ├── Pages/          # Page components
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utility functions
│   ├── App.jsx         # Main App component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── Dockerfile          # Docker configuration
├── package.json        # Dependencies
└── vite.config.js      # Vite configuration
```

## 🎯 Các Cách Chạy Dự Án

### Option 1: Chạy Toàn Bộ Stack với Docker Compose (Khuyến nghị cho Dev)

Cách này sẽ chạy cả Frontend, Backend và Database cùng lúc:

```bash
# Từ thư mục gốc của project
cd /path/to/DoAnChuyenNghanh

# Build và chạy tất cả services
docker-compose up --build

# Hoặc chạy ở background
docker-compose up -d --build
```

**Truy cập:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Xem logs:**
```bash
# Logs frontend
docker-compose logs -f web

# Logs tất cả services
docker-compose logs -f
```

**Dừng services:**
```bash
docker-compose down

# Dừng và xóa volumes (xóa dữ liệu database)
docker-compose down -v
```

---

### Option 2: Chỉ Chạy Frontend với Docker (Development Mode)

Nếu bạn muốn chạy frontend riêng với hot-reload:

#### Bước 1: Build Docker Image
```bash
cd front-end

# Build development image
docker build -t rental-frontend:dev .
```

#### Bước 2: Chạy Container với Volume Mounting
```bash
# Chạy với volume để hot-reload
docker run -d \
  --name rental-frontend \
  -p 3000:80 \
  -v $(pwd)/src:/app/src \
  rental-frontend:dev

# Trên Windows PowerShell, dùng:
docker run -d `
  --name rental-frontend `
  -p 3000:80 `
  -v ${PWD}/src:/app/src `
  rental-frontend:dev
```

#### Bước 3: Truy cập ứng dụng
Mở trình duyệt: http://localhost:3000

---

### Option 3: Chạy Local (Không dùng Docker)

Phù hợp khi cần debug chi tiết hoặc phát triển nhanh:

#### Bước 1: Cài đặt dependencies
```bash
cd front-end

# Cài đặt packages
npm install
```

#### Bước 2: Chạy Development Server
```bash
# Chạy Vite dev server với hot-reload
npm run dev
```

Ứng dụng sẽ chạy tại: http://localhost:5173

#### Bước 3: Build Production (optional)
```bash
# Build production
npm run build

# Preview production build
npm run preview
```

---

## 🔧 Các Lệnh Docker Hữu Ích

### Quản Lý Containers

```bash
# Xem containers đang chạy
docker ps

# Xem tất cả containers (kể cả đã dừng)
docker ps -a

# Dừng container
docker stop rental-frontend

# Khởi động lại container
docker restart rental-frontend

# Xóa container
docker rm rental-frontend

# Xóa container đang chạy (force)
docker rm -f rental-frontend
```

### Quản Lý Images

```bash
# Xem danh sách images
docker images

# Xóa image
docker rmi rental-frontend:dev

# Xóa tất cả unused images
docker image prune -a
```

### Debug & Logs

```bash
# Xem logs
docker logs rental-frontend

# Xem logs real-time
docker logs -f rental-frontend

# Vào trong container để debug
docker exec -it rental-frontend sh

# Kiểm tra resource usage
docker stats rental-frontend
```

---

## 🛠️ Cấu Hình Development

### 1. Environment Variables

Tạo file `.env.local` trong thư mục `front-end/`:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Rental Management
```

### 2. Connect với Backend API

Backend API đang chạy tại: http://localhost:8000

Example fetch:
```javascript
// src/lib/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchData(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`);
  return response.json();
}
```

### 3. CORS Configuration

Backend đã được cấu hình CORS cho:
- http://localhost:3000 (Docker)
- http://localhost:5173 (Local dev)

---

## 📦 Dependencies Chính

- **React 19.2**: UI library
- **Vite 7.2**: Build tool & dev server
- **React Router 7.9**: Routing
- **React Hook Form 7.66**: Form management
- **Zod 4.1**: Validation
- **Tailwind CSS 4.1**: Styling
- **Radix UI**: UI components
- **Lucide React**: Icons

---

## 🐛 Troubleshooting

### Problem 1: Port 3000 đã được sử dụng
```bash
# Tìm process đang dùng port
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Hoặc dùng port khác
docker run -p 3001:80 rental-frontend:dev
```

### Problem 2: Container không start
```bash
# Kiểm tra logs
docker logs rental-frontend

# Build lại image
docker-compose build --no-cache web
```

### Problem 3: Hot-reload không hoạt động
```bash
# Đảm bảo volume được mount đúng
docker inspect rental-frontend | grep Mounts -A 20

# Restart container
docker-compose restart web
```

### Problem 4: Cannot connect to backend
- Kiểm tra backend đang chạy: http://localhost:8000/docs
- Kiểm tra CORS configuration trong backend
- Kiểm tra network connectivity:
  ```bash
  docker-compose exec web ping api
  ```

### Problem 5: Module not found errors
```bash
# Rebuild với fresh install
docker-compose build --no-cache web
docker-compose up web

# Hoặc nếu chạy local
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Workflow Phát Triển

### 1. Bắt đầu làm việc
```bash
# Pull code mới nhất
git pull origin main

# Start services
docker-compose up -d

# Xem logs
docker-compose logs -f web
```

### 2. Develop
- Edit code trong `src/`
- Xem changes tại http://localhost:3000
- Hot-reload tự động cập nhật

### 3. Test với backend
- Backend API: http://localhost:8000/docs
- Test API endpoints
- Kiểm tra CORS

### 4. Commit code
```bash
git add .
git commit -m "feat: your feature description"
git push origin main
```

---

## 🎨 Thêm Component Mới

### Sử dụng shadcn/ui

```bash
# Install shadcn CLI (nếu chưa có)
npm install -g shadcn-ui

# Add component
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
```

### Tạo Component mới

```javascript
// src/components/MyComponent.jsx
import React from 'react';
import { Button } from '@/components/ui/button';

export function MyComponent() {
  return (
    <div>
      <h1>My Component</h1>
      <Button>Click me</Button>
    </div>
  );
}
```

---

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [React Router](https://reactrouter.com/)
- [React Hook Form](https://react-hook-form.com/)

---

## 💡 Tips

1. **Hot Reload**: Sử dụng `npm run dev` cho development nhanh nhất
2. **Docker**: Dùng Docker Compose khi cần test với backend
3. **Console**: Luôn mở DevTools để xem errors/warnings
4. **Network Tab**: Kiểm tra API calls trong DevTools
5. **Extensions**: Cài React DevTools để debug React components

---

## 👥 Support

- **Issues**: Tạo issue trên GitHub
- **Questions**: Hỏi trong team chat
- **Documentation**: Đọc docs trong `/backend/doc/`

---

**Happy Coding! 🚀**
