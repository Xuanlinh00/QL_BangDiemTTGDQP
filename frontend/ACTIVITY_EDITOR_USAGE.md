# Hướng dẫn sử dụng Activity Editor

## Cài đặt

Component đã được tạo sẵn, chỉ cần import và sử dụng.

## Cách sử dụng

### 1. Thêm vào Router

```tsx
// Trong App.tsx hoặc router config
import { ActivityEditorPage } from './pages/ActivityEditorPage';

<Route path="/activities/new" element={<ActivityEditorPage />} />
```

### 2. Hoặc sử dụng trực tiếp

```tsx
import { ActivityEditor } from './components/ActivityEditor';

function MyPage() {
  return <ActivityEditor />;
}
```

## Tính năng đã sửa

### ✅ Các vấn đề đã khắc phục:

1. **Thanh chữ không còn nhảy lung tung**
   - Đã thêm CSS cố định cho các heading
   - Sử dụng margin và line-height phù hợp

2. **Heading hoạt động đúng**
   - Dropdown "Văn bản" cho phép chọn Paragraph, H1-H6
   - Heading được áp dụng đúng kích thước và style

3. **Nút B, I, U, S giữ trạng thái**
   - Thêm state tracking cho active formats
   - Nút sẽ highlight khi đang active
   - Hỗ trợ keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U)

4. **Giao diện giống ảnh**
   - Header với 3 nút: Hủy, Lưu nháp (cyan), Đăng bài (green)
   - Toolbar gọn với dropdown và các nút icon
   - Sidebar bên phải với:
     - Tiêu đề hoạt động
     - Danh mục
     - Ảnh đại diện

## Cấu trúc Component

```
ActivityEditor/
├── ActivityEditor.tsx          # Main component
├── ActivityEditorHeader.tsx    # Header với 3 nút
├── ActivityEditorToolbar.tsx   # Toolbar định dạng
├── ActivityEditorContent.tsx   # Editor area
├── ActivityEditorSidebar.tsx   # Sidebar bên phải
├── ActivityEditor.css          # Styles cho editor
└── index.ts                    # Exports
```

## Toolbar Features

### Dropdown
- **Văn bản**: Paragraph, Heading 1-6
- **Thường**: Normal, Bold, Italic, Underline

### Nút định dạng
- **B** - Bold (Ctrl+B)
- **I** - Italic (Ctrl+I)
- **U** - Underline (Ctrl+U)
- **S** - Strikethrough
- **A** - Text color
- **A̲** - Background color
- **≡** - Bullet list
- **1.** - Numbered list
- **⬅** - Align left
- **⬌** - Align center
- **➡** - Align right
- **⬌** - Justify
- **🔗** - Insert link
- **🖼** - Insert image
- **🎥** - Insert video
- **"** - Quote
- **<>** - Code
- **fx** - Horizontal rule

## API Endpoints

### Lưu nháp
```
POST /api/draft
{
  "title": "Tiêu đề",
  "content": "<p>HTML content</p>",
  "status": "draft"
}
```

### Đăng bài
```
POST /api/posts
{
  "title": "Tiêu đề",
  "content": "<p>HTML content</p>",
  "status": "published"
}
```

## Keyboard Shortcuts

- **Ctrl+B** - Bold
- **Ctrl+I** - Italic
- **Ctrl+U** - Underline

## Lưu ý

1. Content được lưu dưới dạng HTML
2. Cần sanitize HTML ở backend để bảo mật
3. Ảnh được insert qua URL hoặc upload (cần implement upload API)
4. Video được embed qua iframe

## Mở rộng

### Thêm upload ảnh

```tsx
// Trong ActivityEditorToolbar.tsx
const handleUploadImage = async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('/api/upload', formData);
      applyFormat('insertImage', response.data.url);
    }
  };
  input.click();
};
```

### Thêm auto-save

```tsx
// Trong ActivityEditor.tsx
useEffect(() => {
  const timer = setTimeout(() => {
    if (content) {
      saveDraft(title, content);
    }
  }, 30000); // Auto-save mỗi 30s
  
  return () => clearTimeout(timer);
}, [title, content]);
```

## Troubleshooting

### Nếu heading không hoạt động
- Kiểm tra CSS đã được import
- Đảm bảo `ActivityEditor.css` được load

### Nếu nút format không giữ trạng thái
- Kiểm tra `updateActiveFormats()` được gọi sau mỗi command
- Đảm bảo state `activeFormats` được update

### Nếu paste không hoạt động
- Đã xử lý paste để chỉ lấy plain text
- Có thể modify để cho phép paste HTML nếu cần
