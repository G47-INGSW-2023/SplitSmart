'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Expense, ExpenseWithParticipants } from '@/types';
import { Button } from '@/component/ui/button';
import { useState } from 'react';
import AddExpenseModal from './addExpenseModal'; 
import ExpenseDetailModal from './expensesDetailModal';

interface ExpensesTabProps {
  groupId: number;
}

export default function ExpensesTab({ groupId }: ExpensesTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithParticipants | null>(null);

  const { data: expensesData, isLoading, isError, error } = useQuery<ExpenseWithParticipants[]>({
    queryKey: ['expenses', groupId],
    queryFn: () => api.getGroupExpenses(groupId),
  });

  if (isLoading) return <div>Caricamento spese...</div>;
  if (isError) return <div className="text-red-500">Errore nel caricamento delle spese: {error.message}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsModalOpen(true)}>Aggiungi Spesa</Button>
      </div>

      {expensesData && expensesData.length > 0 ? (
        <ul className="space-y-3">
          {expensesData.map((expenseItem) => {
            const [expense, participants] = expenseItem;
            return (
              // 3. Rendi l'intera riga un bottone cliccabile
              <li key={expense.id}>
                <button
                  onClick={() => setSelectedExpense(expenseItem)}
                  className="w-full text-left bg-white p-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">{expense.desc}</p>
                      <p className="text-sm text-gray-500">Pagato da utente ID: {expense.paid_by}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Diviso tra {participants.length} persone
                      </p>
                    </div>
                    <div className="font-bold text-lg text-gray-900">
                      {expense.total_amount.toFixed(2)} €
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

      {/* 4. Renderizza il modale di dettaglio quando una spesa è selezionata */}
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