// lib/api.ts

import type { User, LoginCredentials, UserRegisterData, Group, CreateGroupData, InviteUserData, Expense } from '@/types';

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
   * Recupera le informazioni di un gruppo dall'id.
   */
  getGroupById: async (groupId: number): Promise<Group> => {
    // Il backend ha già questo endpoint: GET /groups/<gid>
    const response = await fetch(`${API_PROXY_URL}/groups/${groupId}`, {
      method: 'GET',
      credentials: 'include',
    });
    const group = await handleResponse<Group>(response);
    if (!group) {
      throw new Error(`Gruppo con ID ${groupId} non trovato.`);
    }
    return group;
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

  /**
   * Elimina un gruppo.
   */
  deleteGroup: async (groupId: number): Promise<void> => {
    const response = await fetch(`${API_PROXY_URL}/groups/${groupId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    // Usiamo una gestione dell'errore semplice
    if (!response.ok) {
      // Se il backend risponde con un JSON di errore, proviamo a leggerlo
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || "Impossibile eliminare il gruppo.";
      throw new Error(errorMessage);
    }
  },

  /**
   * Recupera i membri di un gruppo.
   */
  getGroupMembers: async (groupId: number): Promise<User[]> => {
    console.log(`[API MOCK] Chiamata a getGroupMembers per il gruppo ${groupId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Lista di membri finta
    const members = [
      { id: 1, username: 'Marco Rossi (Tu)', email: 'marco@example.com' },
      { id: 2, username: 'Giulia Bianchi', email: 'giulia@example.com' },
      { id: 3, username: 'Luca Verdi', email: 'luca@example.com' },
    ];
    
    // Lista di ID admin finta (simuliamo che l'utente 1 sia admin)
    const adminIds = [1]; 

    // Aggiungiamo il flag `isAdmin` ai membri che sono anche admin
    return members.map(member => ({
      ...member,
      isAdmin: adminIds.includes(member.id),
    }));
  },

  /**
   * Recupera le spese di un gruppo specifico.
   */
  getGroupExpenses: async (groupId: number): Promise<Expense[]> => {
    // Anche questo endpoint andrebbe creato nel backend
    console.log(`[API MOCK] Chiamata a getGroupExpenses per il gruppo ${groupId}`);
    await new Promise(resolve => setTimeout(resolve, 800));
    return [
      { id: 101, desc: 'Pizza e birra', total_amount: 45.50, paid_by: 1, creation_date: new Date().toISOString() },
      { id: 102, desc: 'Biglietti del cinema', total_amount: 27.00, paid_by: 2, creation_date: new Date().toISOString() },
    ];
  },

  /**
   * Invia un invito a un utente per unirsi a un gruppo.
   */
   inviteUserToGroup: async (groupId: number, data: InviteUserData): Promise<void> => {
    const response = await fetch(`${API_PROXY_URL}/groups/${groupId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `Impossibile inviare l'invito.`;
      throw new Error(errorMessage);
    }

    console.log(`[API] Invito inviato con successo a ${data.email} per il gruppo ${groupId}`);
  },

  /**
   * Promuove un utente a admin del gruppo.
   */
  promoteToAdmin: async (groupId: number, userId: number): Promise<void> => {
    // Il backend ha questo endpoint: POST /groups/<gid>/admins/<uid>
    const response = await fetch(`${API_PROXY_URL}/groups/${groupId}/admins/${userId}`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error("Impossibile promuovere l'utente ad admin.");
    }
    console.log(`[API] Utente ${userId} promosso ad admin nel gruppo ${groupId}`);
  },
};