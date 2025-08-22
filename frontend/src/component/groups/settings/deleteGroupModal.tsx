'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Modal } from '@/component/ui/modal';
import { Button } from '@/component/ui/button';
import { useAuth } from '@/lib/authContext';

interface DeleteGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  groupName: string;
}

export default function DeleteGroupModal({ isOpen, onClose, groupId, groupName }: DeleteGroupModalProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user: currentUser } = useAuth(); // Ottieni l'utente per invalidare la query corretta
  
  const deleteMutation = useMutation({
    mutationFn: () => api.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups-with-balances', currentUser?.id] });
      alert("Gruppo eliminato con successo.");
      router.push('/groups');
      onClose();
    },
    onError: (error) => {
      alert(`Errore: ${error.message}`);
    }
  });
  
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Elimina Gruppo">
      <div className="space-y-4 text-center sm:text-left">
        <p className="text-sm sm:text-base text-gray-700">
          Sei sicuro di voler eliminare definitivamente il gruppo
          <strong className="mx-1 text-red-600">{groupName}</strong>?
        </p>
        <p className="text-sm sm:text-base text-gray-700">
          Questa azione non può essere annullata. Tutti i dati associati verranno persi.
        </p>
        
        {deleteMutation.isError && (
          <p className="text-sm text-red-500 font-medium">
            Errore: {deleteMutation.error.message}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="w-full sm:w-auto"
          >
            {deleteMutation.isPending ? 'Eliminazione in corso...' : 'Sì, elimina'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="w-full sm:w-auto"
          >
            Annulla
          </Button>
        </div>
      </div>
    </Modal>
  );
}