'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ExpenseWithParticipants, User } from '@/types';
import { Modal } from '@/component/ui/modal';

interface ExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseData: ExpenseWithParticipants;
  groupId: number;
}

// Un piccolo componente per mostrare lo stato di caricamento dei nomi
const DetailRowSkeleton = () => (
  <div className="flex justify-between items-center py-2 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-2/5"></div>
    <div className="h-4 bg-gray-200 rounded w-1/5"></div>
  </div>
);

export default function ExpenseDetailModal({ isOpen, onClose, expenseData, groupId }: ExpenseDetailModalProps) {
  const [expense, participants] = expenseData;

  // Usiamo useQuery per recuperare i nomi di tutti i membri del gruppo,
  // così possiamo mappare gli ID ai nomi.
  const { data: members, isLoading: isLoadingMembers } = useQuery<User[]>({
    queryKey: ['members-for-details', groupId], // Chiave diversa per non confliggere
    queryFn: async () => {
      const groupMembers = await api.getGroupMembers(groupId);
      const detailedMembersPromises: Promise<User>[] = groupMembers.map(async (member) => {
        const userDetails = await api.getUserDetails(member.user_id);
        return {
          id: member.user_id,
          username: userDetails.username,
          email: userDetails.email,
        };
      });
      return Promise.all(detailedMembersPromises);
    },
    enabled: isOpen,
  });


  // Creiamo una mappa di ID utente -> Nome utente per una ricerca facile e veloce
  const memberIdToNameMap = new Map(members?.map(m => [m.id, m.username]));
  const payerName = memberIdToNameMap.get(expense.paid_by) || `Utente ID ${expense.paid_by}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Dettagli: ${expense.desc}`}>
      <div className="space-y-4">
        {/* Riepilogo Principale */}
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
        
        {/* Dettaglio Divisione */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Divisione della spesa</h4>
          <div className="border rounded-lg p-2 space-y-1">
            {isLoadingMembers ? (
              // Mostra uno scheletro di caricamento mentre recuperiamo i nomi
              <>
                <DetailRowSkeleton />
                <DetailRowSkeleton />
              </>
            ) : (
              // Mostra i dettagli reali
              participants.map(p => {
                const participantName = memberIdToNameMap.get(p.user_id) || `Utente ID ${p.user_id}`;
                return (
                  <div key={p.user_id} className="flex justify-between items-center py-1 px-2 hover:bg-gray-50 rounded">
                    <span className="text-gray-700">{participantName}</span>
                    <span className="font-medium text-gray-900">{p.amount_due?.toFixed(2)} €</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}