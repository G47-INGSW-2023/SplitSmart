import type { User } from '@/types'; // Assicurati di aver definito questo tipo!

// Dati finti per il login
const MOCK_USER: User = {
  idUtente: '12345',
  nome: 'Marco Rossi',
  email: 'user@example.com',
};

// Funzione di login simulata
export const api = {
  login: async (email: string, password: string): Promise<User> => {
    console.log(`[API MOCK] Tentativo di login con: ${email}`);

    // Simula un ritardo di rete
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (email === 'user@example.com' && password === 'password123') {
      console.log('[API MOCK] Login riuscito!');
      return MOCK_USER;
    } else {
      console.error('[API MOCK] Credenziali non valide!');
      throw new Error('Email o password non corretti.');
    }
  },

  register: async (nome: string, email: string, password: string): Promise<User> => {
    console.log(`[API MOCK] Tentativo di registrazione per: ${email}`);

    // Simula un ritardo di rete
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simula un'email già esistente
    if (email === 'user@example.com') {
      console.error('[API MOCK] Email già in uso!');
      throw new Error('Questo indirizzo email è già registrato.');
    }

    // Simula una password troppo debole
    if (password.length < 8) {
      console.error('[API MOCK] Password troppo debole!');
      throw new Error('La password deve contenere almeno 8 caratteri.');
    }

    console.log('[API MOCK] Registrazione riuscita!');
    // In un caso reale, il backend creerebbe un nuovo ID
    const newUser: User = {
      idUtente: `new_${Date.now()}`,
      nome: nome,
      email: email,
    };
    return newUser;
  },
};