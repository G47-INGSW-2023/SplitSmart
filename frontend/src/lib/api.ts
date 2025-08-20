import type { UserInfo, LoginCredentials, UserRegisterData, Group, CreateGroupData, InviteUserData, GroupInvite, GroupMember, ExpenseWithParticipants, Expense, AddExpenseData, Notific, Friendship, FriendInvite, InviteFriendData } from '@/types';

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
    login: async (credentials: LoginCredentials): Promise<{ userId: number }> => {
    const response = await fetch(`${API_PROXY_URL}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Credenziali non valide o errore del server.');
    }
    const userId = await response.json();
    return { userId };
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
    * Modifica un gruppo.
    */
  updateGroup: async (groupId: number, data: CreateGroupData): Promise<void> => {
    const response = await fetch(`${API_PROXY_URL}/groups/${groupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || "Impossibile aggiornare il gruppo.";
      throw new Error(errorMessage);
    }
  },

  /**
   * Recupera gli ID dei membri di un gruppo.
   */
  getGroupMembers: async (groupId: number): Promise<GroupMember[]> => {
    const response = await fetch(`${API_PROXY_URL}/groups/${groupId}/members`, {
      method: 'GET',
      credentials: 'include',
    });
    return (await handleResponse<GroupMember[]>(response)) || [];
  },
  
  /**
   * Recupera gli ID degli admin di un gruppo.
   */
  getGroupAdmins: async (groupId: number): Promise<GroupMember[]> => {
    const response = await fetch(`${API_PROXY_URL}/groups/${groupId}/admins`, {
      method: 'GET',
      credentials: 'include',
    });
    return (await handleResponse<GroupMember[]>(response)) || [];
  },

  /**
   * Recupera i dettagli di un utente specifico usando il suo ID.
   */
  getUserDetails: async (userId: number): Promise<UserInfo> => {
    const response = await fetch(`${API_PROXY_URL}/user/${userId}`, {
      method: 'GET',
      credentials: 'include',
    });
    const userInfo = await handleResponse<UserInfo>(response);
    if (!userInfo) {
      throw new Error("Impossibile recuperare i dettagli dell'utente.");
    }
    return userInfo;
  },

  /**
   * Recupera le spese di un gruppo
   */
  getGroupExpenses: async (groupId: number): Promise<ExpenseWithParticipants[]> => {
    const response = await fetch(`${API_PROXY_URL}/groups/${groupId}/expenses`, {
      method: 'GET',
      credentials: 'include',
    });
    const expenses = await handleResponse<ExpenseWithParticipants[]>(response);
    return expenses || [];
  },

   /**
   * Aggiunge una nuova spesa a un gruppo.
   */
  addExpense: async (groupId: number, data: AddExpenseData): Promise<Expense> => {
    const response = await fetch(`${API_PROXY_URL}/groups/${groupId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    const newExpense = await handleResponse<Expense>(response);
    if (!newExpense) {
      throw new Error("Il backend non ha restituito la spesa creata.");
    }
    return newExpense;
  },

  /**
   * Aggiorna una spesa esistente. Richiede privilegi di admin.
   */
  updateExpense: async (groupId: number, expenseId: number, data: AddExpenseData): Promise<Expense> => {
    const response = await fetch(`${API_PROXY_URL}/groups/${groupId}/expenses/${expenseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    const updatedExpense = await handleResponse<Expense>(response);
    if (!updatedExpense) {
      throw new Error("Il backend non ha restituito la spesa aggiornata.");
    }
    return updatedExpense;
  },

  /**
   * Elimina una spesa. Richiede privilegi di admin.
   */
  deleteExpense: async (groupId: number, expenseId: number): Promise<void> => {
    const response = await fetch(`${API_PROXY_URL}/groups/${groupId}/expenses/${expenseId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      // Usiamo una gestione dell'errore semplice
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || "Impossibile eliminare la spesa.";
      throw new Error(errorMessage);
    }
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

  /**
   * Rimuove i privilegi di admin a un utente in un gruppo.
   */
  demoteAdmin: async (groupId: number, userId: number): Promise<void> => {
    const response = await fetch(`${API_PROXY_URL}/groups/${groupId}/admins/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || "Impossibile rimuovere i privilegi di admin.";
      throw new Error(errorMessage);
    }
  },

  /**
   * Rimuove un utente da un gruppo. Richiede privilegi di admin (gestiti dal backend).
   */
  removeMemberFromGroup: async (groupId: number, userId: number): Promise<void> => {
    const response = await fetch(`${API_PROXY_URL}/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || "Impossibile rimuovere il membro.";
      throw new Error(errorMessage);
    }
  },

  /**
   * Recupera tutti gli inviti per l'utente corrente.
   */
  getInvites: async (): Promise<GroupInvite[]> => {
    const response = await fetch(`${API_PROXY_URL}/user/invites`, {
      method: 'GET',
      credentials: 'include',
    });
    const invites = await handleResponse<GroupInvite[]>(response);
    return invites || [];
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
   * Aggiunge direttamente un utente esistente a un gruppo.
   */
  addMemberToGroup: async (groupId: number, userId: number): Promise<void> => {
    const response = await fetch(`${API_PROXY_URL}/groups/${groupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }), // Il backend si aspetta questo payload
      credentials: 'include',
    });
    if (!response.ok) { throw new Error("Impossibile aggiungere il membro."); }
  },

  
  /**
   * Accetta un invito a un gruppo.
   */
  acceptInvite: async (inviteId: number): Promise<GroupInvite> => {
    const response = await fetch(`${API_PROXY_URL}/user/invites/${inviteId}/accept`, {
      method: 'PUT', // Il backend usa PUT per aggiornare lo stato
      credentials: 'include',
    });
    const updatedInvite = await handleResponse<GroupInvite>(response);
    if (!updatedInvite) {
      throw new Error("Il backend non ha restituito l'invito aggiornato.");
    }
    return updatedInvite;
  },

  /**
   * Rifiuta un invito a un gruppo.
   */
  rejectInvite: async (inviteId: number): Promise<GroupInvite> => {
    const response = await fetch(`${API_PROXY_URL}/user/invites/${inviteId}/reject`, {
      method: 'PUT',
      credentials: 'include',
    });
    const updatedInvite = await handleResponse<GroupInvite>(response);
    if (!updatedInvite) {
      throw new Error("Il backend non ha restituito l'invito aggiornato.");
    }
    return updatedInvite;
  },

  /**
   * Recupera le notifiche dell'utente.
   */
   getNotifications: async (): Promise<Notific[]> => {
    const response = await fetch(`${API_PROXY_URL}/notifications`, {
      method: 'GET',
      credentials: 'include',
    });
    return (await handleResponse<Notific[]>(response)) || [];
  },

  /**
   * Segna una notifica come letta.
   */
   markNotificationAsRead: async (notificationId: number): Promise<Notific> => {
    const response = await fetch(`${API_PROXY_URL}/notifications/${notificationId}/read`, {
      method: 'GET',
      credentials: 'include',
    });
    const updatedNotification = await handleResponse<Notific>(response);
    if (!updatedNotification) {
      throw new Error("Il backend non ha restituito la notifica aggiornata dopo averla segnata come letta.");
    }
    return updatedNotification;
  },

  /**
   * Recupera la lista degli amici dell'utente.
   */
  getFriends: async (): Promise<Friendship[]> => {
    const response = await fetch(`${API_PROXY_URL}/friends`, { credentials: 'include' });
    return (await handleResponse<Friendship[]>(response)) || [];
  },
  
  /**
   * Recupera la lista delle richieste di amicizia.
   */
  getFriendInvites: async (): Promise<FriendInvite[]> => {
    const response = await fetch(`${API_PROXY_URL}/friends/invites`, { credentials: 'include' });
    return (await handleResponse<FriendInvite[]>(response)) || [];
  },
  
  /**
   * Invia la richiesta di amicizia.
   */
  inviteFriend: async (data: InviteFriendData): Promise<FriendInvite> => {
    const response = await fetch(`${API_PROXY_URL}/friends/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    const newInvite = await handleResponse<FriendInvite>(response);
    if (!newInvite) throw new Error("Il backend non ha restituito l'invito creato.");
    return newInvite;
  },

  /**
   * Accettare la richiesta di amicizia.
   */
  acceptFriendInvite: async (inviteId: number): Promise<FriendInvite> => {
    const response = await fetch(`${API_PROXY_URL}/friends/invites/${inviteId}/accept`, {
      method: 'PUT',
      credentials: 'include',
    });
    const updatedInvite = await handleResponse<FriendInvite>(response);
    if (!updatedInvite) throw new Error("Il backend non ha restituito l'invito aggiornato.");
    return updatedInvite;
  },

  /**
   * Rifiutare la richiesta di amicizia
   */
  rejectFriendInvite: async (inviteId: number): Promise<FriendInvite> => {
    const response = await fetch(`${API_PROXY_URL}/friends/invites/${inviteId}/reject`, {
      method: 'PUT',
      credentials: 'include',
    });
    const updatedInvite = await handleResponse<FriendInvite>(response);
    if (!updatedInvite) throw new Error("Il backend non ha restituito l'invito aggiornato.");
    return updatedInvite;
  },

  /**
   * Rimuove un amico.
   */
  removeFriend: async (friendId: number): Promise<void> => {
    const response = await fetch(`${API_PROXY_URL}/friends/${friendId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || "Impossibile rimuovere l'amico.";
      throw new Error(errorMessage);
    }
  },

  getPrivateExpenses: async (): Promise<ExpenseWithParticipants[]> => {
    // Il backend ha questo montato sotto un nuovo modulo `expenses.rs`,
    // quindi l'URL sarà /expenses.
    const response = await fetch(`${API_PROXY_URL}/expenses`, { credentials: 'include' });
    return (await handleResponse<ExpenseWithParticipants[]>(response)) || [];
  },

   addPrivateExpense: async (data: AddExpenseData): Promise<Expense> => {
    const response = await fetch(`${API_PROXY_URL}/expenses`, {
      // --- CORREZIONI QUI ---
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data), // Invia i dati della spesa
      credentials: 'include',
    });
    const newExpense = await handleResponse<Expense>(response);
    if (!newExpense) throw new Error("Il backend non ha restituito la spesa privata creata.");
    return newExpense;
  },

  updatePrivateExpense: async (expenseId: number, data: AddExpenseData): Promise<Expense> => {
    const response = await fetch(`${API_PROXY_URL}/expenses/${expenseId}`, {
      // --- CORREZIONI QUI ---
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data), // Invia i dati della spesa
      credentials: 'include',
    });
    const updatedExpense = await handleResponse<Expense>(response);
    if (!updatedExpense) throw new Error("Il backend non ha restituito la spesa privata aggiornata.");
    return updatedExpense;
  },

  // deletePrivateExpense è corretto perché DELETE non ha bisogno di un corpo
  deletePrivateExpense: async (expenseId: number): Promise<void> => {
    const response = await fetch(`${API_PROXY_URL}/expenses/${expenseId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error("Impossibile eliminare la spesa privata.");
  },
};