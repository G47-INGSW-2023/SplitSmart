'use client';

import { api } from '@/lib/api';
import { Expense, ExpenseWithParticipants } from '@/types';
import { Button } from '@/component/ui/button';
import { useState } from 'react';
import AddExpenseModal from './addExpenseModal'; 
import ExpenseDetailModal from './expensesDetailModal';
import { useAuth } from '@/lib/authContext'; 

interface ExpensesTabProps {
  groupId: number;
  initialExpenses: ExpenseWithParticipants[];
}

export default function ExpensesTab({ groupId, initialExpenses }: ExpensesTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithParticipants | null>(null);
  const { user: currentUser } = useAuth();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsModalOpen(true)}>Aggiungi Spesa</Button>
      </div>

      {initialExpenses && initialExpenses.length > 0 ? (
        <ul className="space-y-3">
          {initialExpenses.map((expenseItem) => {
            const [expense, participants] = expenseItem;
            let userFinancialStatus = {
              text: 'Non sei coinvolto',
              amount: 0,
              color: 'text-gray-500' // Grigio di default
            };
            
            if (currentUser) {
              const myParticipation = participants.find(p => p.user_id === currentUser.id);

              if (expense.paid_by === currentUser.id) {
                // Ho pagato io la spesa
                // Calcolo quanto mi devono gli altri (totale - la mia quota)
                const myShare = myParticipation?.amount_due || 0;
                const totalOwedToMe = expense.total_amount - myShare;
                userFinancialStatus = {
                  text: 'Ti devono',
                  amount: totalOwedToMe,
                  color: 'text-green-600' // Verde
                };
              } else if (myParticipation) {
                // Non ho pagato io, ma sono coinvolto
                const amountIOwe = myParticipation.amount_due || 0;
                userFinancialStatus = {
                  text: 'Devi dare',
                  amount: amountIOwe,
                  color: 'text-red-600' // Rosso
                };
              }
            }
            return (
              // 3. Rendi l'intera riga un bottone cliccabile
              <li key={expense.id}>
                <button
                  onClick={() => setSelectedExpense(expenseItem)}
                  className="w-full text-left bg-white p-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    {/* Colonna sinistra con Descrizione e Data */}
                    <div>
                      <p className="font-semibold text-gray-800">{expense.desc}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(expense.creation_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long' })}
                      </p>
                    </div>

                    {/* Colonna destra con stato finanziario */}
                    <div className="text-right">
                      <p className={`text-sm ${userFinancialStatus.color}`}>
                        {userFinancialStatus.text}
                      </p>
                      <p className={`font-bold text-lg ${userFinancialStatus.color}`}>
                        {userFinancialStatus.amount > 0 ? userFinancialStatus.amount.toFixed(2) + ' €' : ''}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-center text-gray-500 py-4">Nessuna spesa in questo gruppo. Aggiungine una!</p>
      )}

      <AddExpenseModal
        groupId={groupId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {selectedExpense && (
        <ExpenseDetailModal
          expenseData={selectedExpense}
          isOpen={!!selectedExpense}
          onClose={() => setSelectedExpense(null)}
          groupId={groupId}
        />
      )}
    </div>
  );
}