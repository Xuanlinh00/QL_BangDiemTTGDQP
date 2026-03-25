# Hướng dẫn sử dụng Banner Slideshow

## Vấn đề đã sửa
Hình ảnh thêm vào slideshow banner không được lưu khi reload trang.

## Giải pháp
Hình ảnh banner giờ được lưu trữ trên server (database + disk) thay vì chỉ lưu trong memory của trình duyệt.

## Cách sử dụng

### Cho Admin (Trang quản lý)
1. Truy cập trang **Hoạt động & Tin tức** (About page)
2. Tại phần **Banner Carousel**, nhấn nút **"Thêm hình cho slide [số]"**
3. Chọn file hình ảnh từ máy tính
4. Hình ảnh sẽ được upload lên server và hiển thị ngay trên banner
5. Hình ảnh sẽ được lưu lại khi reload trang

### Cho người dùng (Trang công khai)
- Trang **Hoạt động & Tin tức** (PublicAbout page) sẽ tự động hiển thị các hình ảnh banner đã được admin thêm
- Banner sẽ tự động xoay vòng các slide

## Cấu trúc dữ liệu

### Database
- **Collection**: `centeractivities`
- **Category**: `banner` (để phân biệt với các hoạt động thông thường)
- **Media**: Mảng các file hình ảnh

### File Storage
- **Đường dẫn**: `uploads/activities/{activityId}/`
- **Tên file**: `{mediaId}.{extension}`
- **Cache**: 1 ngày (max-age=86400)

## API Endpoints

### Lấy danh sách hoạt động (bao gồm banner)
```
GET /api/activities
```

### Lấy hình ảnh banner
```
GET /api/activities/{activityId}/media/{mediaIndex}
```

### Thêm hình ảnh banner
```
POST /api/activities
Content-Type: multipart/form-data

{
  title: "Banner Slides",
  description: "Banner slides for homepage",
  category: "banner",
  icon: "🖼️",
  isActive: true,
  order: 0,
  files: [File]
}
```

### Cập nhật banner (thêm hình ảnh)
```
PUT /api/activities/{activityId}
Content-Type: multipart/form-data

{
  files: [File]
}
```

## Thay đổi trong code

### Frontend
- **About.tsx**: Thêm state `bannerActivity` để lưu trữ banner từ database
- **PublicAbout.tsx**: Load banner slides từ API thay vì hardcode

### Backend
- **activities.routes.ts**: Hỗ trợ category `banner` để phân biệt với hoạt động thông thường

## Lưu ý
- Hình ảnh banner được lưu trữ trên disk server, không phải trong MongoDB
- Metadata (tên file, MIME type) được lưu trong MongoDB
- Khi xóa banner activity, tất cả hình ảnh sẽ bị xóa khỏi disk
