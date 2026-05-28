import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Better-Auth uses a different path, we might need a separate client or handle it specifically
export const authClient = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || 'http://localhost:3001/api/auth',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

