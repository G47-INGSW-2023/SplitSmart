// Basato sulla classe Utente
export interface User {
  idUtente: string;
  nome: string;
  email: string;
  // ... non includere mai passwordHash nel frontend!
}

// Basato sulla classe Gruppo
export interface Group {
  idGruppo: string;
  nomeGruppo: string;
  descrizioneGruppo?: string;
  membri: User[];
  // ...
}

// Basato sulla classe Spesa
export interface Expense {
  idSpesa: string;
  descrizione: string;
  importoTotale: number; // Usa number per i calcoli
  pagatore: User;
  // ...
}

export interface UserLogin {
  email: string;
  password: string;
}