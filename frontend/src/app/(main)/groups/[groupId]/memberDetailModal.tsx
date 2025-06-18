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
        {!member.isAdmin && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2, text-gray-800">Azioni</h4>
            <Button
              onClick={() => promoteMutation.mutate()}
              disabled={promoteMutation.isPending}
            >
              {promoteMutation.isPending ? 'Promozione in corso...' : 'Promuovi ad Admin'}
            </Button>
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