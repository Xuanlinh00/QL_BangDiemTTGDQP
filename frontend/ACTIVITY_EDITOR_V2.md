# Activity Editor V2 - Cải tiến hoàn chỉnh

## ✨ Cải tiến chính

### 1. Sử dụng React Quill
- ✅ Editor chuyên nghiệp như Word
- ✅ Không còn nhảy lung tung
- ✅ Heading hoạt động mượt mà
- ✅ Nút format giữ trạng thái
- ✅ Hỗ trợ tất cả định dạng

### 2. Toolbar đầy đủ
- ✅ Heading: H1-H6
- ✅ Text: Bold, Italic, Underline, Strike
- ✅ List: Bullet, Numbered
- ✅ Alignment: Trái, giữa, phải
- ✅ Color: Màu chữ, nền
- ✅ Insert: Link, Image, Video
- ✅ Quote, Code block
- ✅ Clean format

### 3. Upload ảnh nâng cao
- ✅ Upload từ máy tính
- ✅ Nhập URL ảnh
- ✅ Preview ảnh
- ✅ Xóa ảnh

### 4. Trải nghiệm mượt mà
- ✅ Không lag khi gõ
- ✅ Scroll mượt
- ✅ Responsive design
- ✅ Keyboard shortcuts

## 📦 Dependencies

```bash
npm install react-quill quill
```

Đã cài sẵn!

## 🎯 Tính năng

### Editor
- Nhập nội dung giống Word
- Định dạng text tự động
- Paste HTML/text
- Undo/Redo
- Keyboard shortcuts

### Toolbar
```
Heading: H1, H2, H3, H4, H5, H6
Text: Bold, Italic, Underline, Strike
List: Bullet, Numbered
Align: Left, Center, Right, Justify
Color: Text color, Background
Insert: Link, Image, Video
Quote, Code block
Clean format
```

### Sidebar
- Tiêu đề bài viết
- Danh mục
- Ảnh đại diện (upload hoặc URL)

### Header
- Nút Hủy
- Nút Lưu nháp
- Nút Đăng bài

## 🚀 Cách sử dụng

### 1. Truy cập
```
http://localhost:5173/activities/new
```

### 2. Nhập nội dung
- Gõ tiêu đề
- Gõ nội dung trong editor
- Chọn danh mục
- Upload ảnh

### 3. Định dạng
- Chọn text → Click nút format
- Hoặc dùng keyboard shortcuts
- Nút sẽ highlight khi active

### 4. Lưu
- Click "Lưu nháp" → Lưu draft
- Click "Đăng bài" → Publish

## 📝 Keyboard Shortcuts

```
Ctrl+B → Bold
Ctrl+I → Italic
Ctrl+U → Underline
Ctrl+Z → Undo
Ctrl+Y → Redo
```

## 🖼️ Upload ảnh

### Từ máy tính
1. Click "Chọn ảnh"
2. Chọn file
3. Preview hiển thị

### Từ URL
1. Click "Nhập URL ảnh"
2. Nhập URL
3. Click "Thêm"
4. Preview hiển thị

## 🎨 Định dạng

### Text
- Bold, Italic, Underline, Strike
- Màu chữ, Nền

### Paragraph
- Heading 1-6
- Quote
- Code block

### List
- Bullet list
- Numbered list

### Alignment
- Trái
- Giữa
- Phải
- Justify

### Insert
- Link
- Image
- Video

## 💾 Lưu dữ liệu

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

## ✅ Kiểm tra

- [ ] Gõ text bình thường
- [ ] Click B → text đậm
- [ ] Click I → text nghiêng
- [ ] Chọn Heading 1 → text to
- [ ] Không còn nhảy lung tung
- [ ] Nút format highlight
- [ ] Upload ảnh từ máy
- [ ] Nhập URL ảnh
- [ ] Click "Lưu nháp"
- [ ] Click "Đăng bài"

## 🔧 Cấu hình

### Modules
```typescript
const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link', 'image', 'video'],
    [{ 'color': [] }, { 'background': [] }],
    ['clean'],
  ],
};
```

### Formats
```typescript
const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block',
  'list', 'bullet',
  'align',
  'link', 'image', 'video',
  'color', 'background',
];
```

## 📚 Tài liệu

- React Quill: https://react-quill.js.org/
- Quill: https://quilljs.com/

## 🎉 Hoàn tất!

Activity Editor V2 đã sẵn sàng sử dụng với trải nghiệm mượt mà như Word!

## 📞 Support

Nếu có vấn đề:
1. Kiểm tra console (F12)
2. Kiểm tra network tab
3. Xem logs backend
4. Kiểm tra MongoDB connection
