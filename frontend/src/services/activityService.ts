import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ActivityPayload {
  title: string;
  content: string;
  status: 'draft' | 'published';
}

export const activityService = {
  createDraft: async (data: ActivityPayload) => {
    const response = await axios.post(`${API_BASE_URL}/draft`, data);
    return response.data;
  },

  createPost: async (data: ActivityPayload) => {
    const response = await axios.post(`${API_BASE_URL}/posts`, data);
    return response.data;
  },

  getPost: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/posts/${id}`);
    return response.data;
  },

  updatePost: async (id: string, data: Partial<ActivityPayload>) => {
    const response = await axios.put(`${API_BASE_URL}/posts/${id}`, data);
    return response.data;
  },

  deletePost: async (id: string) => {
    const response = await axios.delete(`${API_BASE_URL}/posts/${id}`);
    return response.data;
  },
};
