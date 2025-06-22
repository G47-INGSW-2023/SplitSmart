'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Inizia come true per il check iniziale

  // Funzione per provare a recuperare l'utente se è già loggato
  const checkAuthStatus = useCallback(async () => {
    // Tentativo di recuperare l'ID utente da sessionStorage (più sicuro di localStorage per ID)
    const storedUserId = sessionStorage.getItem('userId');
    if (storedUserId) {
      try {
        const userId = parseInt(storedUserId, 10);
        const userInfo = await api.getUserDetails(userId);
        const fullUser: User = { id: userId, ...userInfo };
        setUser(fullUser);
      } catch (error) {
        console.error("Sessione non più valida.", error);
        setUser(null);
        sessionStorage.removeItem('userId');
      }
    }
  }, []);

  // Al primo caricamento, controlla lo stato
  useEffect(() => {
    setIsLoading(true);
    checkAuthStatus().finally(() => setIsLoading(false));
  }, [checkAuthStatus]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      // 1. Chiama l'API di login per impostare il cookie e ottenere l'ID reale
      const { userId } = await api.login(credentials);
      
      // 2. Chiama l'API per ottenere i dettagli reali dell'utente
      const userInfo = await api.getUserDetails(userId);
      
      // 3. Costruisci l'oggetto User completo e reale
      const authenticatedUser: User = {
        id: userId,
        username: userInfo.username,
        email: userInfo.email,
      };

      // 4. Salva l'utente nello stato del context
      setUser(authenticatedUser);
      
      // 5. Salva l'ID utente in sessionStorage per poter ripristinare la sessione al refresh
      sessionStorage.setItem('userId', userId.toString());

    } catch (error) {
      setUser(null);
      sessionStorage.removeItem('userId');
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
      sessionStorage.removeItem('userId');
      setIsLoading(false);
    }
  };

  const value = { 
    user, 
    isAuthenticated: !!user,
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