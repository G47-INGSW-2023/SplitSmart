// lib/authContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Per ora, non controlliamo lo stato al ricaricamento.
    // L'utente dovrà fare il login ogni volta.
    // Quando /users/me sarà pronto, qui andrà la logica per ripristinare la sessione.
    setIsLoading(false);
  }, []);

  // Funzione semplice che riceve i dati utente (finti) e li imposta nello stato.
  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    // Quando il backend avrà un endpoint /logout, andrà chiamato qui.
    // es: await api.logout();
    setUser(null);
  };

  const value = { user, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
  }
  return context;
};