// lib/api.ts

import type { User, LoginCredentials, UserRegisterData } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Funzione helper per gestire le risposte API.
 * Se la risposta non è OK, lancia un errore.
 * Altrimenti, non fa nulla (permette al chiamante di decidere cosa fare con la risposta).
 */
async function checkResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || errorData.message || `Errore: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }
}

export const api = {
  /**
   * Chiama l'endpoint di login. Si aspetta che il backend imposti un cookie in caso di successo.
   * Restituisce dati utente finti per permettere al frontend di procedere.
   */
  login: async (credentials: LoginCredentials): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include', // Fondamentale per i cookie
    });

    await checkResponse(response);

    // Se la chiamata ha successo (nessun errore lanciato), restituiamo dati finti.
    console.log('[API MOCK] Login al backend riuscito. Restituisco dati utente finti.');
    const mockUser: User = {
      idUtente: 'mock-id-123',
      nome: 'Utente Loggato',
      email: credentials.email,
    };
    return mockUser;
  },

  /**
   * Chiama l'endpoint di registrazione. Non si aspetta un corpo di risposta.
   */
  register: async (data: UserRegisterData): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    await checkResponse(response);
  },
};