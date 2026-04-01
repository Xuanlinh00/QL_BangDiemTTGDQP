import React, { useState } from 'react';
import { ActivityEditorHeader } from './ActivityEditorHeader';
import { ActivityEditorContent } from './ActivityEditorContent';
import { ActivityEditorSidebar } from './ActivityEditorSidebar';
import { useActivityEditor } from '../../hooks/useActivityEditor';

export const ActivityEditor: React.FC = () => {
  const {
    title,
    content,
    setTitle,
    setContent,
    saveDraft,
    publishPost,
    isLoading,
    error,
  } = useActivityEditor();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSaveDraft = async () => {
    await saveDraft(title, content);
  };

  const handlePublish = async () => {
    if (!content.trim() || content === '<p><br></p>') {
      alert('Vui lòng nhập nội dung bài viết');
      return;
    }
    await publishPost(title, content);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <ActivityEditorHeader
          onCancel={() => window.history.back()}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          isLoading={isLoading}
        />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 mx-4 mt-2 rounded text-sm">
            {error}
          </div>
        )}

        {/* Editor Content */}
        <ActivityEditorContent
          content={content}
          onChange={setContent}
        />
      </div>

      {/* Right Sidebar */}
      <ActivityEditorSidebar
        title={title}
        onTitleChange={setTitle}
        selectedImage={selectedImage}
        onImageUpload={handleImageUpload}
      />
    </div>
  );
};
