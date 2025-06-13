import type { User, UserRegisterData, LoginCredentials } from '@/types'; // Aggiorniamo i tipi per essere più specifici

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Funzione helper per gestire le risposte e gli errori comuni
async function handleResponse(response: Response) {
  // La gestione degli errori rimane la stessa, perché di solito gli errori hanno un corpo JSON
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || errorData.message || `Errore: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) {
    return undefined; 
  }
  
  return JSON.parse(text);
}

// Funzione di login simulata
export const api = {
  login: async (credentials: LoginCredentials): Promise<{ token: string }> => {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    const data = await handleResponse(response);
      if (!data || !data.token) {
      throw new Error("La risposta del server per il login non contiene un token.");
    }
    return handleResponse(response);
  },

  /**
   * Registra un nuovo utente.
   * Si aspetta che il backend restituisca un messaggio di successo.
   * es: { "message": "Registrazione avvenuta, controlla la tua email." }
   */
  register: async (data: UserRegisterData): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    await handleResponse(response); // Qui non ci interessa il valore di ritorno
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
     const userData = await handleResponse(response);
    
    // ---- CONTROLLO CRUCIALE ----
    if (!userData) {
      throw new Error("La risposta del server per recuperare l'utente è vuota.");
    }
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