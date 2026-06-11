# SmartQuiz AI - Frontend

Ứng dụng web tạo câu hỏi trắc nghiệm tự động bằng AI, sử dụng React và Vite.

## Mô tả Dự Án

**SmartQuiz AI** là một ứng dụng giúp người dùng tạo các bộ câu hỏi trắc nghiệm một cách tự động nhờ công nghệ AI (Google Gemini). Frontend xây dựng giao diện người dùng thân thiện, cho phép nhập nội dung tài liệu và nhận lại quiz được tạo tự động từ backend.

---

## Công Nghệ Sử Dụng

### Frontend Technologies
| Công Nghệ | Phiên Bản |           Vai Trò                   |
|-----------|-----------|-------------------------------------|
|   React   |   19.2.6  | Xây dựng giao diện người dùng       |
|   Vite    |   8.0.12  | Build tool và dev server            |
|   ESLint  |   10.3.0  | Kiểm tra chất lượng code            |
| Fetch API |     -     | Gửi request từ frontend đến backend |

### Backend Technologies
| Công Nghệ  | Vai Trò |
|------------|--------------------------------|
|   Python   | Ngôn ngữ lập trình backend     |
|   Flask    | Xây dựng REST API              |
| Flask-CORS | Cho phép cross-origin requests |

### AI Technologies
|     Công Nghệ     |             Vai Trò              |
|-------------------|----------------------------------|
| Google Gemini API | Sinh câu hỏi trắc nghiệm bằng AI |
|   Generative AI   | Tạo nội dung tự động             |

### Ngôn Ngữ & Định Dạng
|  Công Nghệ | Vai Trò |
|------------|----------------------------------------|
| JavaScript | Lập trình frontend                     |
|     HTML   | Cấu trúc giao diện web                 |
|     CSS    | Thiết kế giao diện                     |
|     JSON   | Trao đổi dữ liệu giữa frontend/backend |

---

## Hướng Dẫn Cài Đặt & Chạy

### Yêu Cầu
- Node.js (v18 hoặc cao hơn)
- npm hoặc yarn

### Cài Đặt Dependencies
```bash
npm install
```

### Chạy Development Server
```bash
npm run dev
```
Frontend sẽ chạy trên **http://localhost:5173**

### Build Production
```bash
npm run build
```

### Kiểm Tra Code Quality
```bash
npm run lint
```

## Tính Năng Chính

Giao diện đơn giản, dễ sử dụng  
Nhập nội dung tài liệu  
Tạo quiz tự động bằng AI  
Hiển thị kết quả quiz  
Responsive design

## Lưu ý lại các mục cần chạy 

cd D:\smartquiz-ai\frontend
npm run dev

cd D:\smartquiz-ai\backend
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
python app.py