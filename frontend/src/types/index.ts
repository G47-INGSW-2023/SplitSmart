// types/index.ts

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserRegisterData {
  username: string;
  email: string;
  password: string;
}

// Corrisponde alla struct `User` in models.rs (solo i campi che ci servono)
// Ho rimosso password_hash e altri campi sensibili
export interface User {
  id: number;
  username: string;
  email: string;
  isAdmin?: boolean;
}

// Corrisponde alla struct `Group` in models.rs
export interface Group {
  id: number;
  group_name: string;
  desc: string | null;
  creation_date: string; // Le date arrivano come stringhe ISO
}

// Dati per creare un gruppo, corrispondono a `PutGroup`
export interface CreateGroupData {
  name: string; // Il backend si aspetta 'name'
  description?: string;
}

export interface Expense {
  id: number;
  desc: string;
  total_amount: number;
  paid_by: number; // ID dell'utente che ha pagato
  creation_date: string;
}

// Per invitare un utente
export interface InviteUserData {
  email: string;
  message?: string;
}