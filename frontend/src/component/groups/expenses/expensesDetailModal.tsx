'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ExpenseWithParticipants, User } from '@/types';
import { Modal } from '@/component/ui/modal';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/component/ui/button';

interface ExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseData: ExpenseWithParticipants;
  groupId: number;
  isCurrentUserAdmin: boolean; 
  onEditClick: () => void;
}

const DetailRowSkeleton = () => (
  <div className="flex justify-between items-center py-2 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-2/5"></div>
    <div className="h-4 bg-gray-200 rounded w-1/5"></div>
  </div>
);

export default function ExpenseDetailModal({ isOpen, onClose, expenseData, groupId, isCurrentUserAdmin, onEditClick }: ExpenseDetailModalProps) {
  const [expense, participants] = expenseData;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteExpense(groupId, expense.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-details-simplified', groupId] });
      alert("Spesa eliminata con successo.");
      onClose();
    },
    onError: (error) => alert(`Errore: ${error.message}`),
  });
  
  const { data: members, isLoading: isLoadingMembers } = useQuery<User[]>({
    queryKey: ['members-for-details', groupId],
    queryFn: async () => {
      const groupMembers = await api.getGroupMembers(groupId);
      const detailedMembersPromises: Promise<User>[] = groupMembers.map(async (member) => {
        const userDetails = await api.getUserDetails(member.user_id);
        return { id: member.user_id, username: userDetails.username, email: userDetails.email };
      });
      return Promise.all(detailedMembersPromises);
    },
    enabled: isOpen,
  });

  const memberIdToNameMap = new Map(members?.map(m => [m.id, m.username]));
  const payerName = (memberIdToNameMap.get(expense.paid_by) || `Utente ID ${expense.paid_by}`) + (currentUser?.id === expense.paid_by ? ' (Tu)' : '');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Dettagli: ${expense.desc}`}>
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Importo Totale</span>
            <span className="text-2xl font-bold text-gray-800">{expense.total_amount.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-600">Pagato da</span>
            <span className="font-semibold text-gray-800">{payerName}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-600">Data</span>
            <span className="font-semibold text-gray-800">{new Date(expense.creation_date).toLocaleDateString('it-IT')}</span>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Divisione della spesa</h4>
          <div className="border rounded-lg p-2 space-y-1">
            {isLoadingMembers ? (
              <> <DetailRowSkeleton /> <DetailRowSkeleton /> </>
            ) : (
              participants.map(p => {
                const participantName = memberIdToNameMap.get(p.user_id) || `Utente ID ${p.user_id}`;
                return (
                  <div key={p.user_id} className="flex justify-between items-center py-1 px-2 hover:bg-gray-50 rounded">
                    <span className="text-gray-700">
                      {participantName}
                      {currentUser?.id === p.user_id && <span className="font-normal ml-2">(Tu)</span>}
                    </span>
                    <span className="font-medium text-gray-900">{p.amount_due?.toFixed(2)} €</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
        {isCurrentUserAdmin && (
          <div className="border-t pt-4 mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={onEditClick}
              disabled={deleteMutation.isPending}
            >
              Modifica
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (window.confirm("Sei sicuro di voler eliminare questa spesa?")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminazione...' : 'Elimina'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}