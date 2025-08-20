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

interface AddFriendExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: EnrichedFriend;
}

type DivisionType = 'equal' | 'manual';

export default function AddFriendExpenseModal({ isOpen, onClose, friend }: AddFriendExpenseModalProps) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Stati del Form
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [paidById, setPaidById] = useState(currentUser?.id || null);
  const [divisionType, setDivisionType] = useState<DivisionType>('equal');
  
  // Stato per la Divisione Manuale
  const [manualAmounts, setManualAmounts] = useState<Record<number, number | ''>>({});

  // I partecipanti sono solo due: tu e il tuo amico
  const participants = useMemo(() => {
    if (!currentUser) return [friend];
    // Ordina per mettere sempre l'utente corrente per primo
    return [currentUser, friend].sort((a, b) => a.id === currentUser.id ? -1 : 1);
  }, [currentUser, friend]);

  // Effetto per resettare il form quando si apre o si chiude
  useEffect(() => {
    if (isOpen && currentUser) {
      // Imposta i valori di default all'apertura
      setDescription('');
      setTotalAmount('');
      setPaidById(currentUser.id);
      setDivisionType('equal');
      setManualAmounts({});
    }
  }, [isOpen, currentUser]);
  
  // Mutazione per aggiungere la spesa
  const addExpenseMutation = useMutation({
    mutationFn: (data: AddExpenseData) => api.addPrivateExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['private-expenses', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['friend-details', friend.id, currentUser?.id] });
      alert("Spesa aggiunta con successo!");
      onClose();
    },
    onError: (error) => {
      alert(`Errore nell'aggiunta della spesa: ${error.message}`);
    },
  });

  // Logica per calcolare la somma manuale e verificare se è corretta
  const { manualSum, totalIsCorrect } = useMemo(() => {
    const numericTotal = Number(totalAmount) || 0;
    const sum = Object.values(manualAmounts).reduce((acc: number, amount) => acc + (Number(amount) || 0), 0);
    return { 
      manualSum: sum, 
      totalIsCorrect: numericTotal > 0 && Math.abs(sum - numericTotal) < 0.01 
    };
  }, [manualAmounts, totalAmount]);

  // Gestione dell'invio del form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paidById || !currentUser) return;
    const numericTotalAmount = Number(totalAmount) || 0;
    if (numericTotalAmount <= 0) {
      alert("L'importo deve essere maggiore di zero.");
      return;
    }

    let division: [number, number][] = [];

    if (divisionType === 'equal') {
      const amountPerPerson = numericTotalAmount / 2;
      // Correzione arrotondamento per evitare errori di un centesimo
      const amount1 = parseFloat(amountPerPerson.toFixed(2));
      const amount2 = numericTotalAmount - amount1;
      division = [
        [currentUser.id, amount1],
        [friend.id, amount2],
      ];
    } else { // 'manual'
      if (!totalIsCorrect) {
        alert("La somma delle parti non corrisponde all'importo totale.");
        return;
      }
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Aggiungi spesa con ${friend.username}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          placeholder="Descrizione (es. Cena pizza)" 
          required 
          disabled={addExpenseMutation.isPending} 
        />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="friend-exp-amount" className="block text-sm font-medium text-gray-700 mb-1">Importo (€)</label>
            <Input 
              id="friend-exp-amount"
              className='text-gray-500'
              type="number" 
              value={totalAmount} 
              onChange={e => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))} 
              placeholder="0.00" 
              required 
              min="0.01" 
              step="0.01" 
              disabled={addExpenseMutation.isPending} 
            />
          </div>
          <div>
            <label htmlFor="friend-exp-payer" className="block text-sm font-medium text-gray-700 mb-1">Pagato da</label>
            <select 
              id="friend-exp-payer" 
              value={paidById || ''} 
              onChange={(e) => setPaidById(Number(e.target.value))} 
              required 
              disabled={addExpenseMutation.isPending}
              className="w-full h-10 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-600"
            >
              <option value={currentUser?.id}>{currentUser?.username} (Tu)</option>
              <option value={friend.id}>{friend.username}</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 border-b pb-2">
          <button type="button" onClick={() => setDivisionType('equal')} className={`transition-colors ${divisionType === 'equal' ? 'font-bold text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>Dividi 50/50</button>
          <button type="button" onClick={() => setDivisionType('manual')} className={`transition-colors ${divisionType === 'manual' ? 'font-bold text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>Dividi Manualmente</button>
        </div>

        <div className="space-y-2">
          {divisionType === 'equal' ? (
            <div className="text-center p-4 bg-gray-100 rounded-md">
              <p className="text-gray-700">Ognuno paga <span className="font-bold text-gray-900">{((Number(totalAmount) || 0) / 2).toFixed(2)} €</span></p>
            </div>
          ) : (
            participants.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2">
                <label htmlFor={`amount-${p.id}`} className="flex-grow text-gray-800">{p.username}{p.id === currentUser?.id ? ' (La tua quota)' : ''}</label>
                <Input 
                  id={`amount-${p.id}`} 
                  type="number" 
                  value={manualAmounts[p.id] || ''} 
                  onChange={e => setManualAmounts({...manualAmounts, [p.id]: e.target.value === '' ? '' : Number(e.target.value)})} 
                  className="w-28 text-gray-500" 
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            ))
          )}
        </div>

        {divisionType === 'manual' && (Number(totalAmount) || 0) > 0 && (
          <div className={`p-2 rounded text-sm ${totalIsCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p>Totale inserito: {manualSum.toFixed(2)} € di {(Number(totalAmount) || 0).toFixed(2)} €</p>
            {!totalIsCorrect && <p className="font-medium">La somma delle parti non corrisponde al totale.</p>}
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