import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;
    try {
      const parsedUser = JSON.parse(savedUser);
      return {
        ...parsedUser,
        _id: parsedUser._id || parsedUser.id,
        roleId: parsedUser.roleId || (parsedUser.role ? { _id: '', name: parsedUser.role, permissions: [] } : null),
        departmentId: parsedUser.departmentId || (parsedUser.department ? { _id: '', name: parsedUser.department, code: '' } : null)
      };
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const loading = false;

  const login = (newToken: string, newRefreshToken: string, newUser: any) => {
    const mappedUser = {
      ...newUser,
      _id: newUser._id || newUser.id,
      roleId: newUser.roleId || (newUser.role ? { _id: '', name: newUser.role, permissions: [] } : null),
      departmentId: newUser.departmentId || (newUser.department ? { _id: '', name: newUser.department, code: '' } : null)
    };
    localStorage.setItem('token', newToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    localStorage.setItem('user', JSON.stringify(mappedUser));
    setToken(newToken);
    setUser(mappedUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: any) => {
    const mappedUser = {
      ...updatedUser,
      _id: updatedUser._id || updatedUser.id,
      roleId: updatedUser.roleId || (updatedUser.role ? { _id: '', name: updatedUser.role, permissions: [] } : null),
      departmentId: updatedUser.departmentId || (updatedUser.department ? { _id: '', name: updatedUser.department, code: '' } : null)
    };
    localStorage.setItem('user', JSON.stringify(mappedUser));
    setUser(mappedUser);
  };

  useEffect(() => {
    const handleForceLogout = () => {
      logout();
    };

    window.addEventListener('auth_logout', handleForceLogout);
    return () => {
      window.removeEventListener('auth_logout', handleForceLogout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
