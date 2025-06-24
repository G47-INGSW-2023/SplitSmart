'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Modal } from '@/component/ui/modal';
import { Button } from '@/component/ui/button';

interface DeleteGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  groupName: string;
}

export default function DeleteGroupModal({ isOpen, onClose, groupId, groupName }: DeleteGroupModalProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
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
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Sei sicuro di voler eliminare definitivamente il gruppo
          <strong className="mx-1 text-red-600">{groupName}</strong>?
        </p>
        <p className="text-sm font-semibold text-red-700">
          Questa azione non può essere annullata. Tutte le spese e i dati associati verranno persi.
        </p>
        
        {deleteMutation.isError && (
          <p className="text-sm text-red-500">
            Errore: {deleteMutation.error.message}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Annulla
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Eliminazione...' : 'Sì, elimina il gruppo'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}