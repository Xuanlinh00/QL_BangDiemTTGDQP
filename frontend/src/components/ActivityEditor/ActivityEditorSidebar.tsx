import React, { useState } from 'react';
import { ImageIcon, X } from 'lucide-react';

interface ActivityEditorSidebarProps {
  title: string;
  onTitleChange: (title: string) => void;
  selectedImage: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ActivityEditorSidebar: React.FC<ActivityEditorSidebarProps> = ({
  title,
  onTitleChange,
  selectedImage,
  onImageUpload,
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleAddImageFromUrl = () => {
    if (imageUrl.trim()) {
      try {
        new URL(imageUrl);
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
          setImageUrl('');
          setShowUrlInput(false);
        };
        img.onerror = () => {
          alert('URL ảnh không hợp lệ');
        };
      } catch {
        alert('Vui lòng nhập URL hợp lệ');
      }
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      {/* Title Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-blue-600 rounded"></div>
          <h3 className="font-semibold text-gray-900">Cài đặt bài viết</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tiêu đề hoạt động
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Nhập tiêu đề hoạt động..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Category Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-blue-600 rounded"></div>
          <h3 className="font-semibold text-gray-900">Danh mục</h3>
        </div>

        <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700">
          <option value="">-- Chọn danh mục --</option>
          <option value="hoat-dong">Hoạt động</option>
          <option value="su-kien">Sự kiện</option>
          <option value="thong-bao">Thông báo</option>
          <option value="tin-tuc">Tin tức</option>
        </select>
      </div>

      {/* Featured Image Section */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-blue-600 rounded"></div>
          <h3 className="font-semibold text-gray-900">Ảnh đại diện</h3>
        </div>

        {selectedImage ? (
          <div className="relative">
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-48 object-cover rounded border border-gray-200"
            />
            <button
              onClick={() => {}}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Upload from file */}
            <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center hover:border-blue-400 transition">
              <ImageIcon className="mx-auto text-gray-400 mb-2" size={40} />
              <p className="text-sm text-gray-600 mb-3">Tải ảnh từ máy tính</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 text-sm font-medium transition">
                <ImageIcon size={16} />
                Chọn ảnh
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Or divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-xs text-gray-500 px-2">hoặc</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* URL input */}
            {!showUrlInput ? (
              <button
                onClick={() => setShowUrlInput(true)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium transition"
              >
                Nhập URL ảnh
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddImageFromUrl}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition"
                  >
                    Thêm
                  </button>
                  <button
                    onClick={() => {
                      setShowUrlInput(false);
                      setImageUrl('');
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium transition"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
