import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './ActivityEditorContent.css';

interface ActivityEditorContentProps {
  content: string;
  onChange: (content: string) => void;
}

export const ActivityEditorContent: React.FC<ActivityEditorContentProps> = ({
  content,
  onChange,
}) => {
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

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'code-block',
    'list', 'bullet',
    'align',
    'link', 'image', 'video',
    'color', 'background',
  ];

  return (
    <div className="flex-1 overflow-hidden bg-white">
      <ReactQuill
        theme="snow"
        value={content}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder="Nhập nội dung bài viết..."
        className="h-full"
        style={{ height: '100%' }}
      />
    </div>
  );
};
