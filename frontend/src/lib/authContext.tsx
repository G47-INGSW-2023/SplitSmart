'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { api } from './api';
import type { User, LoginCredentials } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Lo stato è un semplice booleano!
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Non più legato al caricamento iniziale

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { userId } = await api.login(credentials);
      
      const authenticatedUser: User = {
        id: userId,
        email: credentials.email,
        username: credentials.email,
      };

      setUser(authenticatedUser);

    } catch (error) {
      setUser(null); 
      throw error; 
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout fallito sul backend, ma procedo.", error);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const value = { 
    user, 
    isAuthenticated: !!user, // Deriva direttamente dalla presenza dell'oggetto user
    isLoading, 
    login, 
    logout 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
  }
  return context;
};