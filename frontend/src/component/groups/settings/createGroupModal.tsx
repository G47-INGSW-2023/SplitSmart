'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/component/ui/button';
import { Input } from '@/component/ui/input';
import { Textarea } from '@/component/ui/textarea'; // Assicurati di avere questo componente
import { Modal } from '@/component/ui/modal'; // E anche questo
import { useAuth } from '@/lib/authContext'; // Importa useAuth per ottenere l'ID utente

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth(); // Ottieni l'utente corrente

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
    }
  }, [isOpen]);
  // useMutation gestisce la logica di chiamata API per azioni (POST, PUT, DELETE)
  const createGroupMutation = useMutation({
    mutationFn: api.createGroup,
    onSuccess: () => {
      // --- CORREZIONE CHIAVE QUI ---
      // Invalidiamo la query che carica la lista dei gruppi con i loro saldi.
      // È importante che la chiave corrisponda esattamente a quella usata in `GroupList.tsx`.
      queryClient.invalidateQueries({ queryKey: ['groups-with-balances', currentUser?.id] });
      
      alert('Gruppo creato con successo!');
      onClose(); // Chiudi il modale
    },
    onError: (error) => {
      console.error("Errore durante la creazione del gruppo:", error);
      alert(`Errore: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const dataToSubmit: { name: string; description?: string } = { name: name.trim() };
    if (description.trim()) {
      dataToSubmit.description = description.trim();
    }
    
    createGroupMutation.mutate(dataToSubmit);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crea un nuovo gruppo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome del gruppo
          </label>
          <Input 
            id="group-name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Es. Vacanze estive"
            required 
            disabled={createGroupMutation.isPending}
            className="text-gray-600"
          />
        </div>
        <div>
          <label htmlFor="group-description" className="block text-sm font-medium text-gray-700 mb-1">
            Descrizione (opzionale)
          </label>
          <Textarea 
            id="group-description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Es. Spese del viaggio in Portogallo"
            disabled={createGroupMutation.isPending}
          />
        </div>
        
        {/* Mostra un messaggio di errore se la mutazione fallisce */}
        {createGroupMutation.isError && (
          <p className="text-sm text-red-500">
            Errore: {createGroupMutation.error.message}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t">
          <Button 
            type="submit" 
            disabled={createGroupMutation.isPending}
            className="w-full sm:w-auto" // A tutta larghezza su mobile
          >
            {createGroupMutation.isPending ? 'Creazione in corso...' : 'Crea gruppo'}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose} 
            disabled={createGroupMutation.isPending}
            className="w-full sm:w-auto" // A tutta larghezza su mobile
          >
            Annulla
          </Button>
        </div>
      </form>
    </Modal>
  );
}