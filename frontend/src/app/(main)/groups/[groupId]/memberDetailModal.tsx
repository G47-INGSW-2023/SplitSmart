'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { User } from '@/types';
import { Button } from '@/component/ui/button';
import { Modal } from '@/component/ui/modal';

interface MemberDetailModalProps {
  member: User;
  groupId: number;
  onClose: () => void;
}

export default function MemberDetailModal({ member, groupId, onClose }: MemberDetailModalProps) {
  const queryClient = useQueryClient();

  const promoteMutation = useMutation({
    mutationFn: () => api.promoteToAdmin(groupId, member.id),
    onSuccess: () => {
      // Invalidiamo la query dei membri per aggiornare la lista e mostrare il nuovo tag "Admin"
      queryClient.invalidateQueries({ queryKey: ['members', groupId] });
      alert(`${member.username} è stato promosso ad amministratore!`);
      onClose();
    },
    onError: (error) => {
      alert(`Errore: ${error.message}`);
    }
  });

  const removeMutation = useMutation({
    mutationFn: () => api.removeMemberFromGroup(groupId, member.id),
    onSuccess: () => {
      // Invalidiamo la cache dei membri per aggiornare la lista
      queryClient.invalidateQueries({ queryKey: ['members', groupId] });
      alert(`${member.username} è stato rimosso dal gruppo.`);
      onClose();
    },
    onError: (error) => alert(`Errore: ${error.message}`),
  });


  const isCurrentUserAdmin = true;
  
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
            {!member.isAdmin && (
              <Button
                onClick={() => promoteMutation.mutate()}
                disabled={promoteMutation.isPending || removeMutation.isPending}
                className="w-full"
              >
                {promoteMutation.isPending ? 'Promozione...' : 'Promuovi ad Admin'}
              </Button>
            )}

            {/* Pulsante Rimuovi (visibile solo se non stiamo cercando di rimuovere noi stessi) */}
            <Button
              variant="destructive" // Usiamo la variante "pericolosa"
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


            {/* Messaggio se non si può rimuovere se stessi */}
            {/*!canBeRemoved && (
              <p className="text-xs text-gray-500 text-center">Non puoi rimuovere te stesso dal gruppo.</p>
            )*/}

          </div>
        )}

        {/* Mostra se l'utente è già admin */}
        {member.isAdmin && (
           <p className="pt-4 border-t text-sm font-semibold text-blue-600">
             Questo utente è già un amministratore del gruppo.
           </p>
        )}
      </div>
    </Modal>
  );
}