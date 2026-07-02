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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('access'));
  const [user, setUser] = useState<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));

  useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete axios.defaults.headers.common['Authorization'];
  }, [token]);

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
