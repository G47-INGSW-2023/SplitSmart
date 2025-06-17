// lib/api.ts

import type { User, LoginCredentials, UserRegisterData, Group, CreateGroupData } from '@/types';

const API_PROXY_URL = '/api-proxy';
/**
 * Funzione helper per gestire le risposte API.
 * Se la risposta non è OK, lancia un errore.
 * Altrimenti, non fa nulla (permette al chiamante di decidere cosa fare con la risposta).
 */
async function handleResponse<T>(response: Response): Promise<T | null> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || errorData.message || `Errore: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : null;
}


export const api = {
  /**
   * Chiama l'endpoint di login. Si aspetta che il backend imposti un cookie in caso di successo.
   */
   login: async (credentials: LoginCredentials): Promise<void> => {
    const response = await fetch(`${API_PROXY_URL}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || 'Credenziali non valide';
      throw new Error(errorMessage);
    }
  },

  /**
   * Chiama l'endpoint di registrazione. Non si aspetta un corpo di risposta.
   */
  register: async (data: UserRegisterData): Promise<void> => {
    const response = await fetch(`${API_PROXY_URL}/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || `Errore durante la registrazione`;
        throw new Error(errorMessage);
    }
  },

  /**
   * Chiama l'endpoint di logout per distruggere la sessione/cookie sul backend.
   */
  logout: async (): Promise<void> => {
    const response = await fetch(`${API_PROXY_URL}/user/logout`, {
        method: 'POST',
        credentials: 'include',
    });
    // Non è necessario lanciare un errore se fallisce, ma logghiamo per debug
    if (!response.ok) { 
      console.error("Logout fallito sul backend, ma si procede con la pulizia del frontend.");
    }
  },
  
  /**
   * Recupera la lista dei gruppi dell'utente.
   */
  getGroups: async (): Promise<Group[]> => {
    const response = await fetch(`${API_PROXY_URL}/groups`, {
      method: 'GET',
      credentials: 'include',
    });
    const groups = await handleResponse<Group[]>(response);
    return groups || [];
  },

  /**
   * Crea un nuovo gruppo.
   */
  createGroup: async (data: CreateGroupData): Promise<Group> => {
    const response = await fetch(`${API_PROXY_URL}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    const newGroup = await handleResponse<Group>(response);
    if (!newGroup) {
      throw new Error("Il backend non ha restituito il gruppo creato.");
    }
    return newGroup;
  },
};