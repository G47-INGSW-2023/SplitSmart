'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AddExpenseData, User } from '@/types';
import { Modal } from '@/component/ui/modal';
import { Input } from '@/component/ui/input';
import { Button } from '@/component/ui/button';
import { useAuth } from '@/lib/authContext';

interface AddExpenseModalProps {
  groupId: number;
  isOpen: boolean;
  onClose: () => void;
}

type DivisionType = 'equal' | 'manual';

export default function AddExpenseModal({ groupId, isOpen, onClose }: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | 0>(0);
  const [paidById, setPaidById] = useState<number | null>(null);
  const [divisionType, setDivisionType] = useState<DivisionType>('equal');
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [manualAmounts, setManualAmounts] = useState<Record<number, number | 0>>({});

  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: members, isLoading: isLoadingMembers } = useQuery<User[]>({
    queryKey: ['members-for-expense', groupId],
    queryFn: async () => {
      const groupMembers = await api.getGroupMembers(groupId);
      const detailedMembersPromises = groupMembers.map(async (member) => {
        const userDetails = await api.getUserDetails(member.user_id);
        return { id: member.user_id, username: userDetails.username, email: userDetails.email };
      });
      return Promise.all(detailedMembersPromises);
    },
    enabled: isOpen,
  });

  const addExpenseMutation = useMutation({
    mutationFn: (data: AddExpenseData) => api.addExpense(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-details-simplified', groupId]});
      alert("Spesa aggiunta con successo!");
      onClose();
    },
    onError: (error) => {
      alert(`Errore nell'aggiunta della spesa: ${error.message}`);
    }
  });

  const { manualSum, totalIsCorrect } = useMemo(() => {
    const numericTotal = Number(totalAmount) || 0;
    const sum = Object.values(manualAmounts).reduce((acc, amount) => acc + (Number(amount) || 0), 0);
    return { manualSum: sum, totalIsCorrect: numericTotal > 0 && Math.abs(sum - numericTotal) < 0.01 };
  }, [manualAmounts, totalAmount]);

  useEffect(() => {
    if (isOpen && currentUser && members) {
      setPaidById(currentUser.id);
      setSelectedMembers(new Set(members.map(m => m.id)));
    }

    if (!isOpen) {
      setDescription('');
      setTotalAmount(0);
      setPaidById(null);
      setDivisionType('equal');
      setSelectedMembers(new Set());
      setManualAmounts({});
    }
  }, [isOpen, currentUser, members]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paidById) return alert("Seleziona chi ha pagato la spesa.");
    
    const numericTotalAmount = Number(totalAmount) || 0;
    if (numericTotalAmount <= 0) return alert("L'importo deve essere maggiore di zero.");

    let division: [number, number][] = [];

    if (divisionType === 'equal') {
      if (selectedMembers.size === 0) return alert("Seleziona almeno un membro per la divisione.");

      const amountPerPerson = numericTotalAmount / selectedMembers.size;
      division = Array.from(selectedMembers).map(memberId => [memberId, parseFloat(amountPerPerson.toFixed(2))]);
      const sumAfterRounding = division.reduce((sum, [, amount]) => sum + amount, 0);
      const remainder = numericTotalAmount - sumAfterRounding;
      
      if (division.length > 0) division[0][1] += remainder;

    } else {
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
  
  const handleToggleMember = (memberId: number) => {
    const newSelection = new Set(selectedMembers);
    if (newSelection.has(memberId)) newSelection.delete(memberId);
    else newSelection.add(memberId);
    setSelectedMembers(newSelection);
  };

  return (
    /* 
   
        
        
    */
    <Modal isOpen={isOpen} onClose={onClose} title="Aggiungi una spesa">
      <form onSubmit={handleSubmit} className="sm: space-y-4">
        <div>
          <label htmlFor="exp-desc" className="text-black block text-sm font-medium sm:mb-1">Descrizione</label>
          <Input id="exp-desc"  className="text-gray-500" placeholder="Inserisci una descrizione" value={description} onChange={e => setDescription(e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-4">
          <div>
            <label htmlFor="exp-amount" className="text-black block text-sm font-medium sm:mb-1">Importo Totale (€)</label>
            <Input id="exp-amount" type="number" className="text-gray-500" placeholder='0' onChange={e => setTotalAmount(Number(e.target.value) || 0)} required min="0.01" step="0.01" />
          </div>
          <div>
            <label htmlFor="exp-payer" className="block text-sm font-medium text-gray-700 sm:mb-1">Pagato da</label>
            <select
              id="exp-payer"
              value={paidById || ''}
              onChange={(e) => setPaidById(Number(e.target.value))}
              disabled={isLoadingMembers}
              required
              className="w-full h-10 border-gray-300 border-1 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-500 px-2"
            >
              <option value="" disabled>Seleziona un membro</option>
              {members?.map(member => (
                <option key={member.id} value={member.id}>
                  {member.username} {member.id === currentUser?.id ? '(Tu)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex border-b">
          <button type="button" onClick={() => setDivisionType('equal')} className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${divisionType === 'equal' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>Divisione Equa</button>
          <button type="button" onClick={() => setDivisionType('manual')} className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${divisionType === 'manual' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>Divisione Manuale</button>
        </div>

        <div className="space-y-1 max-h-48 sm:max-h-60 overflow-y-auto pr-2">
          {isLoadingMembers && <p>Caricamento membri...</p>}

          {divisionType === 'equal' && members?.map(member => (
            <div key={member.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100">
              <input type="checkbox" id={`member-${member.id}`} checked={selectedMembers.has(member.id)} onChange={() => handleToggleMember(member.id)} className="h-4 w-4 rounded"/>
              <label htmlFor={`member-${member.id}`} className="flex-grow text-gray-800">{member.username}</label>
              {selectedMembers.has(member.id) && totalAmount && (
                <span className="text-gray-500 text-sm">{(totalAmount / selectedMembers.size).toFixed(2)} €</span>
              )}
            </div>
          ))}
          {divisionType === 'manual' && members?.map(member => (
            <div key={member.id} className="flex flex-col sm:flex-row sm:items-center sm:gap-3 sm:p-2">
              <label htmlFor={`amount-${member.id}`} className="flex-grow text-gray-800 mb-1 sm:mb-0">{member.username}{member.id === currentUser?.id ? ' (La tua quota)' : ''}</label>
              <Input 
                id={`amount-${member.id}`} 
                type="number" 
                className="w-full sm:w-28 text-gray-600 text-right" 
                placeholder="0.00" 
                step="0.01"
                value={manualAmounts[member.id] || ''}
                onChange={e => setManualAmounts({...manualAmounts, [member.id]: Number(e.target.value) || 0})}
              />
            </div>
          ))}
        </div>

        {divisionType === 'manual' && (Number(totalAmount) || 0) > 0 && (
          <div className={`p-2 rounded text-sm ${totalIsCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p>Totale inserito: {manualSum.toFixed(2)} € di {(Number(totalAmount) || 0).toFixed(2)} €</p>
            {!totalIsCorrect && <p className="font-medium">La somma delle parti non corrisponde al totale.</p>}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:pt-4 border-t">
          <Button 
            type="submit" 
            disabled={addExpenseMutation.isPending || (divisionType === 'manual' && !totalIsCorrect)}
            className="w-full sm:w-auto"
          >
            {addExpenseMutation.isPending ? 'Salvataggio...' : 'Crea Spesa'}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose} 
            disabled={addExpenseMutation.isPending}
            className="w-full sm:w-auto"
          >
            Annulla
          </Button>     
        </div>
      </form>
    </Modal>
  );
} 