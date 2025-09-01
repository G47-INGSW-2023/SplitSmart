'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ExpenseWithParticipants, EnrichedFriend, User } from '@/types';
import { Modal } from '@/component/ui/modal';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/component/ui/button';

interface PrivateExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseData: ExpenseWithParticipants;
  friend: EnrichedFriend;
  onEditClick: () => void;
}

export default function PrivateExpenseDetailModal({ isOpen, onClose, expenseData, friend, onEditClick }: PrivateExpenseDetailModalProps) {
  const [expense, participants] = expenseData;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => api.deletePrivateExpense(expense.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['private-expenses', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['friend-details', friend.id, currentUser?.id] });
      alert("Spesa eliminata con successo.");
      onClose();
    },
    onError: (error) => alert(`Errore: ${error.message}`),
  });

  const participantsList = [currentUser, friend].filter(Boolean) as User[];
  const memberIdToNameMap = new Map(participantsList.map(m => [m.id, m.username]));
  const payerName = memberIdToNameMap.get(expense.paid_by) || `Sconosciuto`;


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Dettagli: ${expense.desc}`}>
      <div className="space-y-4">
        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg space-y-2">
          <div className="flex justify-between items-center text-sm sm:text-base">
            <span className="text-gray-600">Importo Totale</span>
            <span className="text-xl sm:text-2xl font-bold text-gray-800">{expense.total_amount.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between items-center text-sm sm:text-base">
            <span className="text-gray-600">Pagato da</span>
            <span className="font-semibold text-gray-800">{payerName}</span>
          </div>
          <div className="flex justify-between items-center text-sm sm:text-base">
            <span className="text-gray-600">Data</span>
            <span className="font-semibold text-gray-800">{new Date(expense.creation_date).toLocaleDateString('it-IT')}</span>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Divisione della spesa</h4>
          <div className="border rounded-lg p-2 space-y-1">
            {participants.map(p => {
              const participantName = memberIdToNameMap.get(p.user_id);
              return (
                <div key={p.user_id} className="flex justify-between items-center py-1 px-2">
                  <span className="text-gray-700 text-sm sm:text-base">
                    {participantName}
                    {currentUser?.id === p.user_id && <span className="font-normal ml-2">(Tu)</span>}
                  </span>
                  <span className="font-medium text-gray-900  text-sm sm:text-base">{p.amount_due?.toFixed(2)} €</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t pt-4 mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
         <Button 
            variant="destructive" 
            onClick={() => { if (window.confirm("Sei sicuro di voler eliminare questa spesa?")) { deleteMutation.mutate(); }}} 
            disabled={deleteMutation.isPending}
            className="w-full sm:w-auto" 
          >
            {deleteMutation.isPending ? 'Eliminazione...' : 'Elimina'}
          </Button>
          <Button 
            variant="secondary" 
            onClick={onEditClick} 
            disabled={deleteMutation.isPending}
            className="w-full sm:w-auto"
          >
            Modifica
          </Button>
        </div>
      </div>
    </Modal>
  );
}