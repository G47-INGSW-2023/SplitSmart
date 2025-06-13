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
    try {
      // Il context ora è responsabile di recuperare i dati dell'utente
      const userData = await api.getMe(newToken); 
      
      // Se api.getMe ha successo, userData è un oggetto User valido
      setUser(userData);
      localStorage.setItem('authToken', newToken);

    } catch (error) {
      console.error("Errore durante il recupero dei dati utente dopo il login:", error);
      // Se getMe fallisce, il login non è completo, quindi facciamo il logout
      logout();
      // Rilancia l'errore in modo che il form possa mostrarlo all'utente
      throw error;
    }
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