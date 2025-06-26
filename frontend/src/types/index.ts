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

export interface ProcessedMember extends User {
  isAdmin: boolean;
  netBalance: number; // Il suo saldo netto totale nel gruppo
  debts: DebtDetail[]; // La lista dettagliata dei suoi debiti/crediti
}

export interface BalanceDetail {
  otherUserName: string;
  amount: number; 
}

export interface DebtDetail {
  otherMemberId: number;
  otherMemberName: string;
  amount: number;
}

export interface MemberWithDetails {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  netBalance: number; 
  debts: DebtDetail[];
}

export interface SimplifiedTransaction {
  fromId: number;
  fromName: string;
  toId: number;
  toName: string;
  amount: number;
}

export interface Notific {
  id: number;
  notified_user_id: number;
  notification_type: string | null;
  message: string; // Il backend NON ha questo, lo genereremo noi.
  creation_date: string;
  read: boolean;
}

export enum TipoNotifica {
  INVITO_GRUPPO = 'INVITO_GRUPPO',
  RICHIESTA_AMICIZIA = 'RICHIESTA_AMICIZIA',
  GENERALE = 'GENERALE',
}

export enum StatoInvito {
  PENDENTE = 'PENDENTE',
  ACCETTATO = 'ACCETTATO',
  RIFIUTATO = 'RIFIUTATO',
}

export interface Notifica {
  id: string; // Un ID unico, es. "notif-1" o "invite-123"
  tipo: TipoNotifica;
  messaggio: string;
  timestamp: string;
  letta: boolean;
  
  // Campi specifici per gli inviti
  idInvito?: number; // L'ID numerico dell'invito da usare nelle API
  statoInvito?: StatoInvito;
}