import { useState } from 'react';
import { activityService } from '../services/activityService';

export const useActivityEditor = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveDraft = async (draftTitle: string, draftContent: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!draftContent.trim()) {
        setError('Vui lòng nhập nội dung bài viết');
        return;
      }

      await activityService.createDraft({
        title: draftTitle || 'Bài viết không tiêu đề',
        content: draftContent,
        status: 'draft',
      });

      setTitle('');
      setContent('');
      alert('Lưu nháp thành công');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lưu nháp';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const publishPost = async (postTitle: string, postContent: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!postContent.trim()) {
        setError('Vui lòng nhập nội dung bài viết');
        return;
      }

      await activityService.createPost({
        title: postTitle || 'Bài viết không tiêu đề',
        content: postContent,
        status: 'published',
      });

      setTitle('');
      setContent('');
      alert('Đăng bài thành công');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi đăng bài';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    title,
    content,
    status,
    setTitle,
    setContent,
    setStatus,
    saveDraft,
    publishPost,
    isLoading,
    error,
  };
};
