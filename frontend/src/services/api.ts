import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, displayName: string) =>
    api.post('/auth/register', { email, password, displayName }),
  
  loginAsGuest: () =>
    api.post('/auth/guest'),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
  
  refreshToken: (token: string) =>
    api.post('/auth/refresh', { token })
};

// Chat API
export const chatApi = {
  getRoomMessages: (roomName: string, count: number = 50) =>
    api.get(`/chat/rooms/${roomName}/messages?count=${count}`),
  
  getUserRooms: () =>
    api.get('/chat/rooms'),
  
  createRoom: (name: string, description: string, isPrivate: boolean = false) =>
    api.post('/chat/rooms', { name, description, isPrivate })
};

// Stream API
export const streamApi = {
  getActiveStreams: () =>
    api.get('/stream/active'),
  
  getStream: (id: number) =>
    api.get(`/stream/${id}`),
  
  startStream: (title: string, description: string) =>
    api.post('/stream', { title, description }),
  
  endStream: (id: number) =>
    api.post(`/stream/${id}/end`),
  
  validateStreamKey: (streamKey: string) =>
    api.post('/stream/validate-key', { streamKey }),
  
  getViewerCount: (id: number) =>
    api.get(`/stream/${id}/viewer-count`)
};

export default api;