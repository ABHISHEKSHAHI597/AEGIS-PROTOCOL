/**
 * Authentication Context
 * Provides user state and auth methods across the app
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await loginApi({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department,
      facultyId: data.facultyId,
    }));
    setUser({ _id: data._id, name: data.name, email: data.email, role: data.role, department: data.department, facultyId: data.facultyId });
    return data;
  };

  const register = async (name, email, password, role = 'user') => {
    const data = await registerApi({ name, email, password, role });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department,
      facultyId: data.facultyId,
    }));
    setUser({ _id: data._id, name: data.name, email: data.email, role: data.role, department: data.department, facultyId: data.facultyId });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isFaculty: user?.role === 'faculty',
    isAuthor: user?.role === 'author',
    canCreateGrievance: user?.role === 'user' || user?.role === 'author',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
