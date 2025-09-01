import { ReactNode } from "react";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserRegisterData {
  username: string;
  email: string;
  password: string;
}

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

export interface Group {
  id: number;
  group_name: string;
  desc: string | null;
  creation_date: string;
}

export interface CreateGroupData {
  name: string; 
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
  username: ReactNode;
  id: number;
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



export interface ProcessedMember extends User {
  isAdmin: boolean;
  netBalance: number;
  debts: DebtDetail[];
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
  invite_status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
  optional_message: string | null;
}

export interface EnrichedGroupInvite extends GroupInvite {
  group_name: string;
  inviting_user_name: string;
}

export interface Notific {
  id: number;
  notified_user_id: number;
  notification_type: string | null;
  group_id: number | null;
  user_id: number | null;
  expense_id: number | null;
  creation_date: string;
  read: boolean;
  message: string; 
}

export interface Friendship {
  user1: number;
  user2: number;
}

export interface FriendInvite {
  id: number;
  inviting_user_id: number;
  invited_user_id: number;
  invite_date: string;
  invite_status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
}

export interface InviteFriendData {
  email: string;
}

export interface EnrichedFriendInvite extends FriendInvite {
  inviting_user_name: string;
}
export type EnrichedFriend = User;

export type TimelineItem = {
  type: 'private_expense';
  date: string;
  data: ExpenseWithParticipants;
} | {
  type: 'group_balance';
  date: string;
  data: {
    group: Group;
    balance: number; 
  };
};