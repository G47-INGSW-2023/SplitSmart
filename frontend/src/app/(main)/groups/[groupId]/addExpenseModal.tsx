'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { User } from '@/types';
import { Modal } from '@/component/ui/modal';
import { Input } from '@/component/ui/input';
import { Button } from '@/component/ui/button';
import { Textarea } from '@/component/ui/textarea';

interface AddExpenseModalProps {
  groupId: number;
  isOpen: boolean;
  onClose: () => void;
}

type DivisionType = 'equal' | 'manual';

export default function AddExpenseModal({ groupId, isOpen, onClose }: AddExpenseModalProps) {
  // Stato del form
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | 0>(0);
  const [divisionType, setDivisionType] = useState<DivisionType>('equal');

  // Stato per la divisione
  // Per la divisione equa, teniamo traccia degli ID degli utenti selezionati
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  // Per la divisione manuale, teniamo traccia degli importi per ogni utente
  const [manualAmounts, setManualAmounts] = useState<Record<number, number | 0>>({});

  // Recuperiamo i membri del gruppo per mostrarli nella lista
  const { data: members, isLoading: isLoadingMembers } = useQuery<User[]>({
    queryKey: ['members', groupId],
    queryFn: () => api.getGroupMembers(groupId),
    enabled: isOpen, // Esegui la query solo quando il modale è aperto
  });

  // Gestione della logica di divisione
  const handleToggleMember = (memberId: number) => {
    const newSelection = new Set(selectedMembers);
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId);
    } else {
      newSelection.add(memberId);
    }
    setSelectedMembers(newSelection);
  };

  const remainingAmount = totalAmount && Object.values(manualAmounts)
    .reduce((sum, amount) => (Number(sum) || 0) + (Number(amount) || 0), 0);
  const totalIsCorrect = totalAmount !== 0 && remainingAmount === totalAmount;

  // Resetta lo stato quando il modale si chiude
  useEffect(() => {
    if (!isOpen) {
      setDescription('');
      setTotalAmount(0);
      setDivisionType('equal');
      setSelectedMembers(new Set());
      setManualAmounts({});
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Qui andrà la logica di `useMutation` per inviare i dati al backend
    console.log({
      description,
      totalAmount,
      divisionType,
      ...(divisionType === 'equal' && { members: Array.from(selectedMembers) }),
      ...(divisionType === 'manual' && { amounts: manualAmounts }),
    });
    alert("Logica di salvataggio da implementare!");
    // onClose();
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Aggiungi una nuova spesa">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campi Principali */}
        <div>
          <label htmlFor="exp-desc" className="text-black">Descrizione</label>
          <Input id="exp-desc"  className="text-gray-500" placeholder="Inserisci una descrizione" value={description} onChange={e => setDescription(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="exp-amount" className="text-black">Importo Totale (€)</label>
          <Input id="exp-amount" type="number"  className="text-gray-500" value={totalAmount} onChange={e => setTotalAmount(Number(e.target.value) || 0)} required min="0.01" step="0.01" />
        </div>

        {/* Selettore Tipo di Divisione */}
        <div className="flex gap-4 border-b pb-2">
          <button type="button" onClick={() => setDivisionType('equal')} className={divisionType === 'equal' ? 'font-bold text-blue-600' : 'text-gray-700'}>Divisione Equa</button>
          <button type="button" onClick={() => setDivisionType('manual')} className={divisionType === 'manual' ? 'font-bold text-blue-600' : 'text-gray-700'}>Divisione Manuale</button>
        </div>

        {/* Lista Membri */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {isLoadingMembers && <p>Caricamento membri...</p>}
          
          {divisionType === 'equal' && members?.map(member => (
            <div key={member.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100">
              <input type="checkbox" id={`member-${member.id}`} checked={selectedMembers.has(member.id)} onChange={() => handleToggleMember(member.id)} />
              <label htmlFor={`member-${member.id}`} className="flex-grow text-gray-800">{member.username}</label>
              {selectedMembers.has(member.id) && totalAmount && (
                <span className="text-gray-500">{(totalAmount / selectedMembers.size).toFixed(2)} €</span>
              )}
            </div>
          ))}

          {divisionType === 'manual' && members?.map(member => (
            <div key={member.id} className="flex items-center gap-3 p-2">
              <label htmlFor={`amount-${member.id}`} className="flex-grow text-gray-800">{member.username}</label>
              <Input 
                id={`amount-${member.id}`} 
                type="number" 
                className="w-28, text-gray-600" 
                placeholder="0.00" 
                step="0.01"
                value={manualAmounts[member.id] || ''}
                onChange={e => setManualAmounts({...manualAmounts, [member.id]: Number(e.target.value) || 0})}
              />
            </div>
          ))}
        </div>

        {/* Riepilogo e Controllo per Divisione Manuale */}
        {divisionType === 'manual' && totalAmount && (
          <div className={`p-2 rounded text-sm ${totalIsCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p>Totale inserito: {remainingAmount.toFixed(2)} € di {totalAmount.toFixed(2)} €</p>
            {!totalIsCorrect && <p>La somma delle parti non corrisponde al totale.</p>}
          </div>
        )}

        {/* Pulsanti di Azione */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Annulla</Button>
          <Button type="submit" disabled={divisionType === 'manual' && !totalIsCorrect}>Crea Spesa</Button>
        </div>
      </form>
    </Modal>
  );
}