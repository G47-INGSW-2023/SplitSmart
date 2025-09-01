import { Notific, ProcessedMember, SimplifiedTransaction } from "@/types";

export function simplifyDebts(members: Pick<ProcessedMember, 'id' | 'username' | 'netBalance'>[]): SimplifiedTransaction[] {
  const balances = members
    .map(m => ({ id: m.id, username: m.username, balance: m.netBalance }))
    .filter(m => Math.abs(m.balance) > 0.01);
    
  const debtors = balances.filter(p => p.balance < 0).map(p => ({...p, balance: -p.balance}));
  const creditors = balances.filter(p => p.balance > 0);

  const transactions: SimplifiedTransaction[] = [];
  
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    
    const amountToSettle = Math.min(debtor.balance, creditor.balance);

    if (amountToSettle > 0.01) {
      transactions.push({
        fromId: debtor.id,
        fromName: debtor.username,
        toId: creditor.id,
        toName: creditor.username,
        amount: amountToSettle,
      });
    }
    
    debtor.balance -= amountToSettle;
    creditor.balance -= amountToSettle;
    
    if (debtor.balance < 0.01) debtorIndex++;
    if (creditor.balance < 0.01) creditorIndex++;
  }

  return transactions;
}

export function formatNotificationMessage(notification: Notific): string {
  switch (notification.notification_type) {
    case 'NEW_EXPENSE':
    case 'EXPENSE_UPDATED':
    case 'EXPENSE_DELETED':
      return `Aggiornamento su una spesa nel gruppo ID ${notification.group_id}.`;
    
    case 'GROUP_INVITE':
      return `Hai ricevuto un invito per il gruppo ID ${notification.group_id}.`;
    
    case 'FRIENDSHIP_REQUEST_ACCEPTED':
      return `Notifica di amicizia accettata.`;
      
    case 'FRIENDSHIP_REQUEST_DENIED':
      return `Notifica di amicizia rifiutata.`;
    
    default:
      return `Hai una nuova notifica non specificata (ID: ${notification.id}).`;
  }
}