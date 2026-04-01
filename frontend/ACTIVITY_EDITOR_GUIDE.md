# Activity Editor Component - Hướng dẫn sử dụng

## Cấu trúc Component

```
ActivityEditor/
├── ActivityEditor.tsx          # Component chính
├── ActivityEditorHeader.tsx     # Header với các nút hành động
├── ActivityEditorToolbar.tsx    # Toolbar định dạng
├── ActivityEditorContent.tsx    # Editor contentEditable
├── ActivityEditorPreview.tsx    # Preview HTML
└── index.ts                     # Export
```

## Cách sử dụng

### 1. Import component
```tsx
import { ActivityEditor } from '@/components/ActivityEditor';
```

### 2. Sử dụng trong route
```tsx
// App.tsx hoặc router config
import { ActivityEditorPage } from '@/pages/ActivityEditorPage';

<Route path="/activity/new" element={<ActivityEditorPage />} />
```

### 3. Hoặc sử dụng trực tiếp
```tsx
<ActivityEditor />
```

## Các tính năng

### Header
- **Tiêu đề**: "Thêm hoạt động mới"
- **Nút Hủy**: Quay lại trang trước
- **Nút Lưu nháp**: Gửi POST /draft với status="draft"
- **Nút Đăng bài**: Gửi POST /posts với status="published"

### Toolbar
- **Format Block**: Paragraph, Heading 1-6, Code Block
- **Text Style**: Bold, Italic, Underline, Strikethrough
- **Colors**: Màu chữ, Highlight nền
- **Lists**: Bullet list, Numbered list
- **Alignment**: Căn trái, giữa, phải, justify
- **Links**: Chèn link, Xóa link
- **Media**: Chèn ảnh, Chèn video
- **Indentation**: Thụt dòng, Giảm thụt dòng
- **Special**: Đường kẻ ngang, Blockquote, Code block
- **Clear Format**: Xóa tất cả định dạng

### Editor
- Nhập tiêu đề tại phần trên cùng
- Nhập nội dung giống Word
- Hỗ trợ paste HTML
- Tự động lưu HTML vào state

### Preview
- Nhấn "Xem trước" để hiển thị preview
- Hiển thị HTML được render
- Có thể ẩn/hiện preview

## API Endpoints

### Lưu nháp
```
POST /api/draft
Body: {
  title: string,
  content: string (HTML),
  status: "draft"
}
```

### Đăng bài
```
POST /api/posts
Body: {
  title: string,
  content: string (HTML),
  status: "published"
}
```

## State Management

Component sử dụng hook `useActivityEditor` để quản lý:
- `title`: Tiêu đề bài viết
- `content`: Nội dung HTML
- `status`: "draft" hoặc "published"
- `isLoading`: Trạng thái loading
- `error`: Thông báo lỗi

## Validation

- Không cho đăng bài nếu content rỗng
- Hiển thị thông báo lỗi nếu có
- Tự động set tiêu đề mặc định nếu không nhập

## Styling

- Sử dụng Tailwind CSS
- Giao diện gọn, không có khoảng trắng dư
- Toolbar cố định phía trên
- Editor có scroll riêng
- Preview panel bên phải (khi bật)

## Yêu cầu dependencies

```json
{
  "react": "^18.0.0",
  "lucide-react": "^latest",
  "axios": "^latest",
  "tailwindcss": "^latest"
}
```

## Lưu ý

1. Cần cấu hình `VITE_API_URL` trong `.env`
2. API phải hỗ trợ CORS
3. Cần xác thực (auth token) nếu API yêu cầu
4. HTML được lưu trực tiếp, cần sanitize ở backend

## Mở rộng

### Thêm xác thực
```tsx
// Trong useActivityEditor.ts
const token = localStorage.getItem('token');
const headers = { Authorization: `Bearer ${token}` };
```

### Thêm upload ảnh
```tsx
// Trong ActivityEditorToolbar.tsx
const handleUploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post('/api/upload', formData);
  execCommand('insertImage', response.data.url);
};
```

### Thêm auto-save
```tsx
// Trong ActivityEditor.tsx
useEffect(() => {
  const timer = setTimeout(() => {
    saveDraft(title, content);
  }, 30000); // Auto-save mỗi 30s
  return () => clearTimeout(timer);
}, [title, content]);
```
