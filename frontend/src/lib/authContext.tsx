'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { api } from './api';
import type { LoginCredentials } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Lo stato è un semplice booleano!
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Non più legato al caricamento iniziale

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      await api.login(credentials);
      // Se la chiamata ha successo, il cookie è impostato.
      // L'utente è autenticato.
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout fallito sul backend, ma procedo.", error);
    }
    setIsAuthenticated(false);
  };

  const value = { isAuthenticated, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
  }
  return context;
};