'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Expense } from '@/types';
import { Button } from '@/component/ui/button';
import { useState } from 'react';
import AddExpenseModal from './addExpenseModal'; 

interface ExpensesTabProps {
  groupId: number;
}

export default function ExpensesTab({ groupId }: ExpensesTabProps) {
const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: expenses, isLoading, isError } = useQuery<Expense[]>({
    queryKey: ['expenses', groupId],
    queryFn: () => api.getGroupExpenses(groupId),
  });

  if (isLoading) return <div>Caricamento spese...</div>;
  if (isError) return <div>Errore nel caricamento delle spese.</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsModalOpen(true)}>Aggiungi Spesa</Button>
      </div>
      {expenses && expenses.length > 0 ? (
        <ul className="space-y-3">
          {expenses.map(expense => (
            <li key={expense.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">{expense.desc}</p>
                <p className="text-sm text-gray-500">Pagato da utente ID: {expense.paid_by}</p>
              </div>
              <div className="font-bold text-lg text-gray-900">
                {expense.total_amount.toFixed(2)} €
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 py-4">Nessuna spesa in questo gruppo.</p>
      )}
      <AddExpenseModal
        groupId={groupId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}