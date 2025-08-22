'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Group } from '@/types';
import { Modal } from '@/component/ui/modal';
import { Button } from '@/component/ui/button';
import { Input } from '@/component/ui/input';
import { Textarea } from '@/component/ui/textarea';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
}

export default function EditGroupModal({ isOpen, onClose, group }: EditGroupModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(group.group_name);
  const [description, setDescription] = useState(group.desc || '');

  useEffect(() => {
    if (group) {
      setName(group.group_name);
      setDescription(group.desc || '');
    }
  }, [group]);

  const updateMutation = useMutation({
    mutationFn: (updatedData: { name: string, description?: string }) => api.updateGroup(group.id, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-details-processed', group.id] });
      alert('Gruppo aggiornato con successo!');
      onClose();
    },
    onError: (error) => {
      alert(`Errore: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const dataToSubmit: { name: string; description?: string } = { name: name.trim() };
    if (description.trim()) dataToSubmit.description = description.trim();
  
    updateMutation.mutate(dataToSubmit);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifica Gruppo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-group-name" className="block text-sm font-medium text-gray-700 mb-1"> Nome del gruppo </label>
          <Input 
            id="edit-group-name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            disabled={updateMutation.isPending}
            className="text-gray-600"
          />
        </div>

        <div>
          <label htmlFor="edit-group-description" className="block text-sm font-medium text-gray-700 mb-1"> Descrizione (opzionale) </label>
          <Textarea 
            id="edit-group-description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            disabled={updateMutation.isPending}
          />
        </div>

        {updateMutation.isError && (
          <p className="text-sm text-red-500">{updateMutation.error.message}</p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t">
          <Button 
            type="submit" 
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto" // A tutta larghezza su mobile
          >
            {updateMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose} 
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto" // A tutta larghezza su mobile
          >
            Annulla
          </Button>
        </div>
      </form>
    </Modal>
  );
}