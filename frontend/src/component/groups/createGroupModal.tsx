'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/component/ui/button';
import { Input } from '@/component/ui/input';
import { Textarea } from '@/component/ui/textarea'; // Assicurati di avere questo componente
import { Modal } from '@/component/ui/modal'; // E anche questo

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  // useMutation gestisce la logica di chiamata API per azioni (POST, PUT, DELETE)
  const createGroupMutation = useMutation({
    mutationFn: api.createGroup, // La funzione da eseguire
    onSuccess: () => {
      // Quando la creazione ha successo:
      // 1. Invalidiamo la query 'groups'. React Query la rieseguirà automaticamente,
      //    aggiornando la lista dei gruppi nella dashboard. È magico!
      console.log('Gruppo creato! Invalido la cache dei gruppi.');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      
      // 2. Chiudiamo il modale e resettiamo i campi
      onClose();
      setName('');
      setDescription('');
    },
    onError: (error) => {
      // Possiamo gestire l'errore qui se vogliamo fare qualcosa di specifico
      console.error("Errore durante la creazione del gruppo:", error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      // Aggiungiamo una piccola validazione
      return;
    }
    // Eseguiamo la mutazione con i dati del form
    createGroupMutation.mutate({ name, description });
  };

  if (!isOpen) {
    return null;
  }

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

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose} 
            disabled={createGroupMutation.isPending}
          >
            Annulla
          </Button>
          <Button type="submit" disabled={createGroupMutation.isPending}>
            {createGroupMutation.isPending ? 'Creazione in corso...' : 'Crea gruppo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}