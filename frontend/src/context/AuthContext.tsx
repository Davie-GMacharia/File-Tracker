import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
interface User { username: string; first_name: string; last_name: string; }
interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}
interface RegisterData { username: string; password: string; email: string; first_name: string; last_name: string; }
const AuthContext = createContext<AuthCtx | null>(null);

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem('refresh');
  if (!refresh) return null;
  try {
    const res = await axios.post('/api/auth/refresh/', { refresh });
    const newAccess = res.data.access;
    localStorage.setItem('access', newAccess);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
    return newAccess;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('access'));
  const [user, setUser] = useState<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));

  useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete axios.defaults.headers.common['Authorization'];
  }, [token]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/api/auth/')
        ) {
          originalRequest._retry = true;
          if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => {
              refreshPromise = null;
            });
          }
          const newAccess = await refreshPromise;
          if (newAccess) {
            setToken(newAccess);
            originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
            return axios(originalRequest);
          } else {
            localStorage.clear();
            setToken(null);
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
            window.location.href = '/auth';
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const login = async (username: string, password: string) => {
    const res = await axios.post('/api/auth/login/', { username, password });
    const { access, refresh } = res.data;
    localStorage.setItem('access', access);
    localStorage.setItem('refresh', refresh);
    // Decode basic user info from token payload
    const payload = JSON.parse(atob(access.split('.')[1]));
    const u = { username, first_name: '', last_name: '', ...payload };
    localStorage.setItem('user', JSON.stringify(u));
    setToken(access);
    setUser(u);
  };
  const register = async (data: RegisterData) => {
    await axios.post('/api/auth/register/', data);
    await login(data.username, data.password);
  };
  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };
  return <AuthContext.Provider value={{ user, token, login, register, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
