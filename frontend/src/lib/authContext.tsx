'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from './api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null; // Aggiungiamo il token
  isLoading: boolean;
  login: (token: string) => Promise<void>; // Login ora accetta un token
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Funzione per caricare i dati dell'utente usando un token
  const loadUserFromToken = useCallback(async (storedToken: string) => {
    try {
      // Usa il token per chiedere al backend "chi sono?"
      const userData = await api.getMe(storedToken);
      setUser(userData);
      setToken(storedToken);
    } catch (error) {
      console.error("Token non valido o scaduto. Effettuare il logout.", error);
      // Se il token non è più valido, pulisci tutto
      logout();
    }
  }, []);

  // Eseguito al primo caricamento per ripristinare la sessione
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      loadUserFromToken(storedToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [loadUserFromToken]);

  const login = async (newToken: string) => {
    localStorage.setItem('authToken', newToken);
    await loadUserFromToken(newToken); // Carica i dati dell'utente dopo aver ricevuto il token
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  const value = { user, token, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};