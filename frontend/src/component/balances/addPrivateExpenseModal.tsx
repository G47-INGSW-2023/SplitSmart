'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AddExpenseData, EnrichedFriend } from '@/types';
import { Modal } from '@/component/ui/modal';
import { Input } from '@/component/ui/input';
import { Button } from '@/component/ui/button';
import { Textarea } from '@/component/ui/textarea';
import { useAuth } from '@/lib/authContext';

interface AddPrivateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: EnrichedFriend[];
}

type DivisionType = 'equal' | 'manual';

export default function AddPrivateExpenseModal({ isOpen, onClose, friends }: AddPrivateExpenseModalProps) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Stati del Form
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [paidById, setPaidById] = useState<number | null>(null);
  const [divisionType, setDivisionType] = useState<DivisionType>('equal');
  
  // Stati per la Divisione
  const [selectedFriends, setSelectedFriends] = useState<Set<number>>(new Set());
  const [manualAmounts, setManualAmounts] = useState<Record<number, number | ''>>({});

  // Lista di tutti i possibili partecipanti (tu + i tuoi amici)
  const participants = useMemo(() => {
    return currentUser ? [currentUser, ...friends] : friends;
  }, [currentUser, friends]);

  // Effetto per impostare i default e resettare il form
  useEffect(() => {
    if (isOpen && currentUser) {
      // Imposta te stesso come pagatore di default
      setPaidById(currentUser.id);
      // Seleziona tutti gli amici di default per la divisione equa
      setSelectedFriends(new Set(friends.map(f => f.id)));
    }

    // Reset quando si chiude
    if (!isOpen) {
      setDescription('');
      setTotalAmount('');
      setPaidById(null);
      setDivisionType('equal');
      setSelectedFriends(new Set());
      setManualAmounts({});
    }
  }, [isOpen, currentUser, friends]);

  const addExpenseMutation = useMutation({
    mutationFn: (data: AddExpenseData) => api.addPrivateExpense(data),
    onSuccess: () => {
      // Invalida la cache delle spese private per aggiornare la pagina dei saldi
      queryClient.invalidateQueries({ queryKey: ['private-expenses', currentUser?.id] });
      alert("Spesa privata aggiunta con successo!");
      onClose();
    },
    onError: (error) => {
      alert(`Errore nell'aggiunta della spesa: ${error.message}`);
    }
  });

  const { manualSum, totalIsCorrect } = useMemo(() => {
    const numericTotal = Number(totalAmount) || 0;
    const sum = Object.values(manualAmounts).reduce((acc: number, amount) => acc + (Number(amount) || 0), 0);
    return { manualSum: sum, totalIsCorrect: numericTotal > 0 && Math.abs(sum - numericTotal) < 0.01 };
  }, [manualAmounts, totalAmount]);
  
  const handleToggleFriend = (friendId: number) => {
    const newSelection = new Set(selectedFriends);
    if (newSelection.has(friendId)) newSelection.delete(friendId);
    else newSelection.add(friendId);
    setSelectedFriends(newSelection);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paidById) return alert("Seleziona chi ha pagato la spesa.");
    
    const numericTotalAmount = Number(totalAmount) || 0;
    if (numericTotalAmount <= 0) return alert("L'importo deve essere maggiore di zero.");

    let division: [number, number][] = [];
    const participantsInExpense = new Set([paidById, ...selectedFriends]);

    if (divisionType === 'equal') {
      if (participantsInExpense.size === 0) return alert("Seleziona almeno un partecipante.");
      const amountPerPerson = numericTotalAmount / participantsInExpense.size;
      division = Array.from(participantsInExpense).map(memberId => [memberId, parseFloat(amountPerPerson.toFixed(2))]);
      // ... (logica di correzione arrotondamento)
    } else { // 'manual'
      if (!totalIsCorrect) return alert("La somma delle parti non corrisponde all'importo totale.");
      division = Object.entries(manualAmounts)
        .filter(([, amount]) => Number(amount) > 0)
        .map(([userId, amount]) => [Number(userId), Number(amount) as number]);
    }

    const expenseData: AddExpenseData = {
      desc: description,
      total_amount: numericTotalAmount,
      paid_by: paidById,
      division,
    };
    addExpenseMutation.mutate(expenseData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Aggiungi Spesa Privata">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrizione (es. Cena pizza)" required disabled={addExpenseMutation.isPending} />

        <div className="grid grid-cols-2 gap-4">
          <Input type="number" className="text-gray-500" value={totalAmount} onChange={e => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00 €" required min="0.01" step="0.01" disabled={addExpenseMutation.isPending} />
          <select value={paidById || ''} onChange={(e) => setPaidById(Number(e.target.value))} required className="w-full h-10 border-gray-300 rounded-md text-gray-800">
            <option value="" disabled>Pagato da...</option>
            {participants.map(p => (
              <option key={p.id} value={p.id}>{p.username}{p.id === currentUser?.id ? ' (Tu)' : ''}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 border-b pb-2">
          <button type="button" onClick={() => setDivisionType('equal')} className={divisionType === 'equal' ? 'font-bold text-blue-600' : 'text-gray-700'}>Divisione Equa</button>
          <button type="button" onClick={() => setDivisionType('manual')} className={divisionType === 'manual' ? 'font-bold text-blue-600' : 'text-gray-700'}>Divisione Manuale</button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {divisionType === 'equal' && friends.map(friend => (
            <div key={friend.id} className="flex items-center gap-3 p-2">
              <input type="checkbox" id={`friend-${friend.id}`} checked={selectedFriends.has(friend.id)} onChange={() => handleToggleFriend(friend.id)} />
              <label htmlFor={`friend-${friend.id}`} className="flex-grow">{friend.username}</label>
            </div>
          ))}
          {divisionType === 'manual' && participants.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-2">
              <label htmlFor={`amount-${p.id}`} className="flex-grow">{p.username}{p.id === currentUser?.id ? ' (La tua quota)' : ''}</label>
              <Input id={`amount-${p.id}`} type="number" value={manualAmounts[p.id] || ''} onChange={e => setManualAmounts({...manualAmounts, [p.id]: e.target.value === '' ? '' : Number(e.target.value)})} className="w-28" />
            </div>
          ))}
        </div>

        {divisionType === 'manual' && (Number(totalAmount) || 0) > 0 && (
          <div className={`p-2 rounded text-sm ${totalIsCorrect ? '...' : '...'}`}>
            <p>Totale inserito: {manualSum.toFixed(2)} € di {(Number(totalAmount) || 0).toFixed(2)} €</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={addExpenseMutation.isPending}>Annulla</Button>
          <Button type="submit" disabled={addExpenseMutation.isPending || (divisionType === 'manual' && !totalIsCorrect)}>
            {addExpenseMutation.isPending ? 'Salvataggio...' : 'Aggiungi Spesa'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}