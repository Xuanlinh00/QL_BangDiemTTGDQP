import React from 'react';

interface ActivityEditorHeaderProps {
  onCancel: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  isLoading: boolean;
}

export const ActivityEditorHeader: React.FC<ActivityEditorHeaderProps> = ({
  onCancel,
  onSaveDraft,
  onPublish,
  isLoading,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-gray-900 italic">Thêm hoạt động mới</h1>

      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition disabled:opacity-50"
        >
          Hủy
        </button>

        <button
          onClick={onSaveDraft}
          disabled={isLoading}
          className="px-4 py-2 text-sm bg-cyan-500 text-white hover:bg-cyan-600 rounded transition disabled:opacity-50"
        >
          Lưu nháp
        </button>

        <button
          onClick={onPublish}
          disabled={isLoading}
          className="px-4 py-2 text-sm bg-green-500 text-white hover:bg-green-600 rounded transition disabled:opacity-50"
        >
          {isLoading ? 'Đang xử lý...' : 'Đăng bài'}
        </button>
      </div>
    </div>
  );
};
