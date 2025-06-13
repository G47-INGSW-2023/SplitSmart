'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from '@/types';

// Definiamo cosa conterrà il nostro Context
interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean; // Utile per sapere se stiamo ancora verificando l'utente
}

// Creiamo il Context con un valore di default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Creiamo il Provider, il componente che "fornirà" il contesto
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Partiamo con true

  // In un'app reale, qui verificheresti se c'è un token/sessione valida
  // Per ora, lo lasciamo semplice. Mettiamo isLoading a false dopo un po'.
  // TODO: Implementare il controllo della sessione al caricamento dell'app
  useState(() => {
    setTimeout(() => setIsLoading(false), 500); // Simula il controllo
  });

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    // TODO: Qui dovresti anche invalidare il token sul server
  };

  const value = { user, login, logout, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Creiamo un custom hook per usare facilmente il contesto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};