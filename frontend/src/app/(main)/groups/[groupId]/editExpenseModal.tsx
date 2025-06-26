'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AddExpenseData, ExpenseWithParticipants, User } from '@/types';
import { api } from '@/lib/api';
import { Modal } from '@/component/ui/modal';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/component/ui/button';
import { Textarea } from '@/component/ui/textarea';
import { Input } from '@/component/ui/input';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  expenseData: ExpenseWithParticipants; 
}

type DivisionType = 'equal' | 'manual';

export default function EditExpenseModal({ isOpen, onClose, groupId, expenseData }: EditExpenseModalProps) {
  const [expense, participants] = expenseData;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [description, setDescription] = useState(expense.desc);
  const [totalAmount, setTotalAmount] = useState<number | ''>(expense.total_amount);
  const [paidById, setPaidById] = useState<number | null>(expense.paid_by);
  const [divisionType, setDivisionType] = useState<DivisionType>('equal'); 
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [manualAmounts, setManualAmounts] = useState<Record<number, number | ''>>({});

  const { data: members, isLoading: isLoadingMembers } = useQuery<User[]>({
    queryKey: ['members-for-expense-edit', groupId],
    queryFn: async () => {
      const groupMembers = await api.getGroupMembers(groupId);
      const detailedMembersPromises = groupMembers.map(async (member) => {
        const userDetails = await api.getUserDetails(member.user_id);
        return {
          id: member.user_id, // Aggiungiamo l'ID
          username: userDetails.username,
          email: userDetails.email,
        };
      });
      return Promise.all(detailedMembersPromises);
    },
    enabled: isOpen,
  });

 
  useEffect(() => {
    if (members && participants) {
      setDivisionType('manual');
      const initialAmounts: Record<number, number | ''> = {};
      participants.forEach(p => {
        initialAmounts[p.user_id] = p.amount_due || '';
      });
      setManualAmounts(initialAmounts);
    }
  }, [members, participants]);

  const updateMutation = useMutation({
    mutationFn: (data: AddExpenseData) => api.updateExpense(groupId, expense.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-details-simplified', groupId] });
      alert("Spesa modificata con successo!");
      onClose();
    },
    onError: (error) => alert(`Errore: ${error.message}`),
  });

  const { manualSum, totalIsCorrect } = useMemo(() => {
    const numericTotal = Number(totalAmount) || 0;
    const sum = Object.values(manualAmounts).reduce((acc: number, amount) => acc + (Number(amount) || 0), 0);
    return {
      manualSum: sum,
      totalIsCorrect: numericTotal > 0 && Math.abs(sum - numericTotal) < 0.01,
    };
  }, [manualAmounts, totalAmount]);
  
  const handleToggleMember = (memberId: number) => {
    const newSelection = new Set(selectedMembers);
    if (newSelection.has(memberId)) newSelection.delete(memberId);
    else newSelection.add(memberId);
    setSelectedMembers(newSelection);
  };

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
    updateMutation.mutate(expenseData);
  };
   return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Modifica: ${expense.desc}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-exp-desc" className="text-black">Descrizione</label>
          <Input id="edit-exp-desc" className="text-gray-500" value={description} onChange={e => setDescription(e.target.value)} required disabled={updateMutation.isPending} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-exp-amount" className="text-black">Importo Totale (€)</label>
            <Input id="edit-exp-amount" className="text-gray-500" type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))} required min="0.01" step="0.01" disabled={updateMutation.isPending} />
          </div>
          <div>
            <label htmlFor="edit-exp-payer" className="block text-sm font-medium text-gray-700 mb-1">Pagato da</label>
            <select 
                id="edit-exp-payer" value={paidById || ''} 
                onChange={(e) => setPaidById(Number(e.target.value))} disabled={isLoadingMembers || updateMutation.isPending} 
                required 
                className="w-full h-10 border-gray-300 border-1 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-500"
            >
              <option value="" disabled>Seleziona un membro</option>
              {members?.map(member => (
                <option key={member.id} value={member.id}>{member.username} {member.id === currentUser?.id ? '(Tu)' : ''}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Selettore Divisione */}
        <div className="flex gap-4 border-b pb-2">
          <button type="button" onClick={() => setDivisionType('equal')} className={divisionType === 'equal' ? 'font-bold text-blue-600' : 'text-gray-700'}>Divisione Equa</button>
          <button type="button" onClick={() => setDivisionType('manual')} className={divisionType === 'manual' ? 'font-bold text-blue-600' : 'text-gray-700'}>Divisione Manuale</button>
        </div>

        {/* Lista Membri */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {isLoadingMembers ? <p>Caricamento membri...</p> : 
            divisionType === 'equal' ? (
              members?.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100">
                  <input type="checkbox" id={`edit-member-${member.id}`} checked={selectedMembers.has(member.id)} onChange={() => handleToggleMember(member.id)} />
                  <label htmlFor={`edit-member-${member.id}`} className="flex-grow  text-gray-800">{member.username}</label>
                  {selectedMembers.has(member.id) && totalAmount && (
                    <span className="text-gray-500">{(Number(totalAmount) / selectedMembers.size).toFixed(2)} €</span>
                  )}
                </div>
              ))
            ) : (
              members?.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-2">
                  <label htmlFor={`edit-amount-${member.id}`} className="flex-grow text-gray-800">{member.username}</label>
                  <Input 
                    id={`edit-amount-${member.id}`} 
                    type="number" 
                    value={manualAmounts[member.id] || ''} 
                    onChange={e => setManualAmounts({...manualAmounts, [member.id]: e.target.value === '' ? '' : Number(e.target.value)})}
                    className="w-28, text-gray-600" 
                  />
                </div>
              ))
            )
          }
        </div>
        
        {/* Riepilogo Divisione Manuale */}
        {divisionType === 'manual' && (Number(totalAmount) || 0) > 0 && (
          <div className={`p-2 rounded text-sm ${totalIsCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p>Totale inserito: {manualSum.toFixed(2)} € di {(Number(totalAmount) || 0).toFixed(2)} €</p>
            {!totalIsCorrect && <p>La somma delle parti non corrisponde al totale.</p>}
          </div>
        )}

        {/* Pulsanti Azione */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={updateMutation.isPending}>Annulla</Button>
          <Button type="submit" disabled={updateMutation.isPending || (divisionType === 'manual' && !totalIsCorrect)}>
            {updateMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
          </Button>       
        </div>
      </form>
    </Modal>
  );
}