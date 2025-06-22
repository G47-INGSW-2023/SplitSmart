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
}

export interface UserInfo {
    username: string;
    email: string;
    registration_date: string;
    last_login: string | null;
}

export interface GroupMember {
  group_id: number;
  user_id: number;
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
  creation_date: string;
  paid_by: number;
  group_id: number | null;
}

export interface ExpenseParticipation {
  expense_id: number;
  user_id: number;
  amount_due: number | null;
}

export type ExpenseWithParticipants = [Expense, ExpenseParticipation[]];

export interface AddExpenseData {
  desc: string;
  total_amount: number;
  paid_by: number;
  division: [number, number][];
}

// Per invitare un utente
export interface InviteUserData {
  email: string;
  message?: string;
}

export interface GroupInvite {
  id: number;
  group_id: number;
  invited_user_id: number;
  inviting_user_id: number;
  invite_date: string;
  invite_status: "PENDING" | "ACCEPTED" | "REJECTED" | null;
  optional_message: string | null;
}

export interface MemberDetails extends User {
  isAdmin: boolean;
}