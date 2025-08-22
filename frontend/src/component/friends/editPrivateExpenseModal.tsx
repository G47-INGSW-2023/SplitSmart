'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AddExpenseData, EnrichedFriend, ExpenseWithParticipants } from '@/types';
import { Modal } from '@/component/ui/modal';
import { Input } from '@/component/ui/input';
import { Button } from '@/component/ui/button';
import { useAuth } from '@/lib/authContext';

interface EditPrivateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: EnrichedFriend;
  expenseData: ExpenseWithParticipants;
}

type DivisionType = 'equal' | 'manual';

export default function EditPrivateExpenseModal({ isOpen, onClose, friend, expenseData }: EditPrivateExpenseModalProps) {
  const [expense, participants] = expenseData;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [description, setDescription] = useState(expense.desc);
  const [totalAmount, setTotalAmount] = useState<number | ''>(expense.total_amount);
  const [paidById, setPaidById] = useState<number | null>(expense.paid_by);
  const [divisionType, setDivisionType] = useState<DivisionType>('manual');
  const [manualAmounts, setManualAmounts] = useState<Record<number, number | ''>>({});
  
  // Pre-compila il form con i dati esistenti
  useEffect(() => {
    if (isOpen) {
      const initialAmounts: Record<number, number | ''> = {};
      participants.forEach(p => { initialAmounts[p.user_id] = p.amount_due ?? ''; });
      setManualAmounts(initialAmounts);
    }
  }, [isOpen, participants]);

  const updateMutation = useMutation({
    mutationFn: (data: AddExpenseData) => api.updatePrivateExpense(expense.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['private-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['friend-details', friend.id] });
      alert("Spesa modificata!");
      onClose();
    },
  });

  const { manualSum, totalIsCorrect } = useMemo(() => {
      const numericTotal = Number(totalAmount) || 0;
      const sum = Object.values(manualAmounts).reduce((acc: number, amount) => acc + (Number(amount) || 0), 0);
      return { 
        manualSum: sum, 
        totalIsCorrect: numericTotal > 0 && Math.abs(sum - numericTotal) < 0.01 
      };
    }, [manualAmounts, totalAmount]);
    
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
    updateMutation.mutate(expenseData);
  };

  // Creiamo una lista dei partecipanti per usarla nella UI
  const participantDetails = useMemo(() => {
    if (!currentUser) return [friend];
    return [currentUser, friend];
  }, [currentUser, friend]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Modifica: ${expense.desc}`}>
      <form onSubmit={handleSubmit} className="sm:space-y-4">
        <div>
          <label htmlFor="friend-exp-desc" className="text-black block text-sm font-medium sm:mb-1">Descrizione</label>
          <Input id="friend-exp-desc" className="text-gray-500" value={description} onChange={e => setDescription(e.target.value)} required disabled={updateMutation.isPending} />
        </div>
      
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-4">
          <div>
            <label htmlFor="friend-exp-amount" className="text-black block text-sm font-medium sm:mb-1">Importo Totale (€)</label>
            <Input id="friend-exp-amount"
              className='text-gray-500'
              type="number" 
              value={totalAmount} 
              onChange={e => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))} 
              required 
              min="0.01" 
              step="0.01" 
              disabled={updateMutation.isPending} 
            />
          </div>
          <div>
            <label htmlFor="friend-exp-payer" className="block text-sm font-medium text-gray-700 sm:mb-1">Pagato da</label>
            <select 
              id="friend-exp-payer" 
              value={paidById || ''} 
              onChange={(e) => setPaidById(Number(e.target.value))} 
              required 
              disabled={updateMutation.isPending}
              className="w-full h-10 border-gray-300 border-1 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-500"
            >
              <option value={currentUser?.id}>{currentUser?.username} (Tu)</option>
              <option value={friend.id}>{friend.username}</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 border-b py-2">
          <button type="button" onClick={() => setDivisionType('equal')} className={divisionType === 'equal' ? 'font-bold text-blue-600' : 'text-gray-700'}>Divisione Equa</button>
          <button type="button" onClick={() => setDivisionType('manual')} className={divisionType === 'manual' ? 'font-bold text-blue-600' : 'text-gray-700'}>Divisione Manuale</button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {divisionType === 'equal' ? (
            <div className="text-center p-4 bg-gray-100 rounded-md">
              <p className="text-gray-700">Ognuno paga <span className="font-bold text-gray-900">{((Number(totalAmount) || 0) / 2).toFixed(2)} €</span></p>
            </div>
          ) : (
            participantDetails.map(p => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:gap-3 sm:p-2">
                <label htmlFor={`amount-${p.id}`} className="flex-grow text-gray-800">{p.username}{p.id === currentUser?.id ? ' (La tua quota)' : ''}</label>
                <Input 
                  id={`amount-${p.id}`} 
                  type="number" 
                  value={manualAmounts[p.id] || ''} 
                  onChange={e => setManualAmounts({...manualAmounts, [p.id]: e.target.value === '' ? '' : Number(e.target.value)})} 
                  className="w-full sm:w-28 text-gray-600" 
                />
              </div>
            ))
          )}
        </div>

        {divisionType === 'manual' && (Number(totalAmount) || 0) > 0 && (
          <div className={`p-2 rounded text-sm ${totalIsCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p>Totale inserito: {manualSum.toFixed(2)} € di {(Number(totalAmount) || 0).toFixed(2)} €</p>
            {!totalIsCorrect && <p>La somma delle parti non corrisponde al totale.</p>}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:pt-4 border-t">
          <Button 
            type="submit" 
            disabled={updateMutation.isPending || (divisionType === 'manual' && !totalIsCorrect)}
            className="w-full sm:w-auto"
          >
            {updateMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose} 
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto"
          >
            Annulla
          </Button>
        </div>
      </form>
    </Modal>
  );
}