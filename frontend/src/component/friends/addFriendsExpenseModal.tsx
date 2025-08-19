'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AddExpenseData, EnrichedFriend } from '@/types';
import { Modal } from '@/component/ui/modal';
import { Input } from '@/component/ui/input';
import { Button } from '@/component/ui/button';
import { useAuth } from '@/lib/authContext';

interface AddFriendExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: EnrichedFriend;
}

export default function AddFriendExpenseModal({ isOpen, onClose, friend }: AddFriendExpenseModalProps) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [paidById, setPaidById] = useState(currentUser?.id || null);

  const addExpenseMutation = useMutation({
    mutationFn: (data: AddExpenseData) => api.addPrivateExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['private-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['friend-details', friend.id] });
      queryClient.invalidateQueries({ queryKey: ['friends-list'] }); // <-- Aggiungi questo
      alert("Spesa aggiunta!");
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paidById || !currentUser) return;
    const numericTotal = Number(totalAmount) || 0;
    if (numericTotal <= 0) return;

    const amountPerPerson = numericTotal / 2;
    
    const expenseData: AddExpenseData = {
      desc: description,
      total_amount: numericTotal,
      paid_by: paidById,
      division: [
        [currentUser.id, amountPerPerson],
        [friend.id, amountPerPerson],
      ],
    };
    addExpenseMutation.mutate(expenseData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Aggiungi spesa con ${friend.username}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrizione" required />
        <Input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00 €" required />
        
        <fieldset className="flex gap-4">
          <legend>Pagato da:</legend>
          <label><input type="radio" name="payer" value={currentUser?.id} checked={paidById === currentUser?.id} onChange={() => setPaidById(currentUser!.id)} /> Tu</label>
          <label><input type="radio" name="payer" value={friend.id} checked={paidById === friend.id} onChange={() => setPaidById(friend.id)} /> {friend.username}</label>
        </fieldset>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annulla</Button>
          <Button type="submit" disabled={addExpenseMutation.isPending}>Aggiungi</Button>
        </div>
      </form>
    </Modal>
  );
}