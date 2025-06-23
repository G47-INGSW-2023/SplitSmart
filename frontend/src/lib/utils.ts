import { ProcessedMember } from "@/types";

export interface SimplifiedTransaction {
  fromId: number;
  fromName: string;
  toId: number;
  toName: string;
  amount: number;
}

export function simplifyDebts(members: ProcessedMember[]): SimplifiedTransaction[] {
  // 1. Creare una lista di saldi non nulli
  const balances = members
    .filter(m => Math.abs(m.balance) > 0.01) // Usiamo una tolleranza
    .map(m => ({ id: m.id, username: m.username, balance: m.balance }));
    
  // 2. Separare debitori (saldo negativo) e creditori (saldo positivo)
  const debtors = balances.filter(p => p.balance < 0).map(p => ({...p, balance: -p.balance})); // Rendiamo il debito un valore positivo
  const creditors = balances.filter(p => p.balance > 0);

  const transactions: SimplifiedTransaction[] = [];
  
  let debtorIndex = 0;
  let creditorIndex = 0;

  // 3. Finchè ci sono debitori e creditori da saldare...
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    
    // L'importo da trasferire è il minimo tra quanto il debitore deve
    // e quanto il creditore deve ricevere.
    const amountToSettle = Math.min(debtor.balance, creditor.balance);

    // Registra questa transazione
    transactions.push({
      fromId: debtor.id,
      fromName: debtor.username,
      toId: creditor.id,
      toName: creditor.username,
      amount: amountToSettle,
    });
    
    // Aggiorna i saldi rimanenti
    debtor.balance -= amountToSettle;
    creditor.balance -= amountToSettle;
    
    // Se il debitore ha finito di pagare, passa al prossimo
    if (debtor.balance < 0.01) {
      debtorIndex++;
    }
    
    // Se il creditore ha ricevuto tutto, passa al prossimo
    if (creditor.balance < 0.01) {
      creditorIndex++;
    }
  }

  return transactions;
}