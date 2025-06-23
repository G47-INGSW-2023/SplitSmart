'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProcessedMember, ExpenseWithParticipants } from '@/types';
import { Button } from '@/component/ui/button';
import { Modal } from '@/component/ui/modal';
import { useAuth } from '@/lib/authContext';

interface MemberDetailModalProps {
  member: ProcessedMember;
  groupId: number;
  onClose: () => void;
  isCurrentUserAdmin: boolean;
}

export default function MemberDetailModal({ member, groupId, onClose, isCurrentUserAdmin }: MemberDetailModalProps) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const promoteMutation = useMutation({
    mutationFn: () => api.promoteToAdmin(groupId, member.id),
    onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ['group-details-processed', groupId] });
      alert(`${member.username} è stato promosso ad amministratore!`);
      onClose();
    },
    onError: (error) => alert(`Errore: ${error.message}`),
  });

  const removeMutation = useMutation({
    mutationFn: () => api.removeMemberFromGroup(groupId, member.id),
    onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ['group-details-processed', groupId] });
      alert(`${member.username} è stato rimosso dal gruppo.`);
      onClose();
    },
    onError: (error) => alert(`Errore: ${error.message}`),
  });


  const demoteMutation = useMutation({
    mutationFn: () => api.demoteAdmin(groupId, member.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-details-processed', groupId] });
      alert(`I privilegi di admin sono stati rimossi da ${member.username}.`);
      onClose();
    },
    onError: (error) => alert(`Errore: ${error.message}`),
  });
  
  const isLoading = promoteMutation.isPending || removeMutation.isPending || demoteMutation.isPending;
  const isSelf = currentUser?.id === member.id;

  return (
    <Modal isOpen={true} onClose={onClose} title={`Dettagli di ${member.username}`}>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-black">Username</p>
          <p className="font-semibold text-gray-500">{member.username}</p>
        </div>
        <div>
          <p className="text-sm text-gray-800">Email</p>
          <p className="font-semibold text-gray-500">{member.email}</p>
        </div>

        {/* Mostra il pulsante di promozione solo se l'utente non è già admin */}
         {isCurrentUserAdmin && (
          <div className="pt-4 border-t space-y-3">            
            {/* Pulsante Promuovi (visibile solo se non è già admin) */}
            {member.isAdmin ? (
              // E non è l'utente corrente (non puoi degradare te stesso)
              !isSelf && (
                <Button
                  onClick={() => demoteMutation.mutate()}
                  disabled={isLoading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white" // Stile diverso per questa azione
                >
                  {demoteMutation.isPending ? 'Rimozione privilegi...' : 'Rimuovi privilegi di Admin'}
                </Button>
              )
            ) : (
              // Se non è admin, mostra il pulsante per promuoverlo
              <Button
                onClick={() => promoteMutation.mutate()}
                disabled={isLoading}
                className="w-full"
              >
                {promoteMutation.isPending ? 'Promozione...' : 'Promuovi ad Admin'}
              </Button>
            )}

            {/* Messaggio se non si può rimuovere se stessi */}
           {!isSelf && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm(`Sei sicuro di voler rimuovere ${member.username} dal gruppo?`)) {
                    removeMutation.mutate();
                  }
                }}
                disabled={promoteMutation.isPending || removeMutation.isPending}
                className="w-full"
              >
                {removeMutation.isPending ? 'Rimozione...' : 'Rimuovi dal Gruppo'}
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}