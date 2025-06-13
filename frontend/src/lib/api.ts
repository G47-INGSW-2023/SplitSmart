import type { User, UserRegisterData, LoginCredentials } from '@/types'; // Aggiorniamo i tipi per essere più specifici

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Funzione helper per gestire le risposte e gli errori comuni
async function handleResponse(response: Response) {
  if (!response.ok) {
    // Prova a leggere il corpo dell'errore per un messaggio più specifico
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `Errore: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }
  return response.json();
}

// Funzione di login simulata
export const api = {
  login: async (credentials: LoginCredentials): Promise<{ token: string }> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  /**
   * Registra un nuovo utente.
   * Si aspetta che il backend restituisca un messaggio di successo.
   * es: { "message": "Registrazione avvenuta, controlla la tua email." }
   */
  register: async (data: UserRegisterData): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Recupera i dati dell'utente loggato usando il token.
   * Questa è una nuova funzione fondamentale!
   */
  getMe: async (token: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users/me`, { // Assumi un endpoint come /users/me o /profile
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  // Qui aggiungerai le altre chiamate: getGroups, addExpense, etc.
  // Esempio:
  // getGroups: async (token: string): Promise<Group[]> => {
  //   const response = await fetch(`${API_BASE_URL}/groups`, {
  //     headers: { 'Authorization': `Bearer ${token}` },
  //   });
  //   return handleResponse(response);
  // }
};