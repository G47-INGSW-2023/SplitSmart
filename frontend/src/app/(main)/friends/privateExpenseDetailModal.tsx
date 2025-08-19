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
  friend: EnrichedFriend; // L'amico coinvolto
  onEditClick: () => void;
}

export default function PrivateExpenseDetailModal({ isOpen, onClose, expenseData, friend, onEditClick }: PrivateExpenseDetailModalProps) {
  const [expense, participants] = expenseData;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Mutazione per cancellare una spesa PRIVATA
  const deleteMutation = useMutation({
    mutationFn: () => api.deletePrivateExpense(expense.id),
    onSuccess: () => {
      // Invalida le query relative alle spese private e ai dettagli dell'amico
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

  // L'utente può modificare/cancellare una spesa privata solo se l'ha pagata lui
  const canPerformActions = expense.paid_by === currentUser?.id;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Dettagli: ${expense.desc}`}>
      <div className="space-y-4">
        {/* Riepilogo (identico a quello del gruppo) */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center"><span className="text-gray-600">Importo Totale</span><span className="text-2xl font-bold">{expense.total_amount.toFixed(2)} €</span></div>
          <div className="flex justify-between items-center mt-2"><span className="text-gray-600">Pagato da</span><span className="font-semibold">{payerName}</span></div>
          <div className="flex justify-between items-center mt-1"><span className="text-gray-600">Data</span><span className="font-semibold">{new Date(expense.creation_date).toLocaleDateString('it-IT')}</span></div>
        </div>
        
        {/* Divisione (identica, ma mostra solo 2 persone) */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Divisione della spesa</h4>
          <div className="border rounded-lg p-2 space-y-1">
            {participants.map(p => {
              const participantName = memberIdToNameMap.get(p.user_id);
              return (
                <div key={p.user_id} className="flex justify-between items-center py-1">
                  <span>{participantName}{p.user_id === currentUser?.id ? ' (Tu)' : ''}</span>
                  <span className="font-medium">{p.amount_due?.toFixed(2)} €</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Azioni (solo se hai pagato tu) */}
          <div className="border-t pt-4 mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={onEditClick}>Modifica</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Eliminazione...' : 'Elimina'}
            </Button>
          </div>
      </div>
    </Modal>
  );
}