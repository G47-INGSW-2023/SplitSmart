'use client';

// Rimuoviamo `useMemo`, `simplifyDebts`, `SimplifiedTransaction` che non servono più
import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { ProcessedMember, ExpenseWithParticipants, MemberWithDetails } from '@/types';
import { Button } from '@/component/ui/button';
import { Input } from '@/component/ui/input';
import MemberDetailModal from './memberDetailModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface MembersTabProps {
  groupId: number;
  initialMembers: ProcessedMember[];
  isCurrentUserAdmin: boolean;
  totalBalance: number; // Aggiungi questa riga
}

const MemberRow = ({ member }: { member: ProcessedMember }) => {
  const [isExpanded, setIsExpanded] = useState(false); // Stato di espansione per ogni riga
  const { user: currentUser } = useAuth();
  
  const isSelf = member.id === currentUser?.id;
  const balance = member.netBalance;
  const balanceColor = balance > 0.01 ? 'text-green-600' : balance < -0.01 ? 'text-red-600' : 'text-gray-500';

  return (
    <li className="bg-white rounded-lg shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        {/* Colonna Sinistra: Nome, (Tu), [Admin] */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{member.username}</span>
          {isSelf && <span className="font-normal text-blue-600 ml-1">(Tu)</span>}
          {member.isAdmin && <span className="text-xs font-semibold ...">Admin</span>}
        </div>
        {/* Colonna Destra: Saldo Netto */}
        <div className={`text-right ${balanceColor}`}>
          <p className="font-semibold">{Math.abs(balance).toFixed(2)} €</p>
          <p className="text-xs">
            {balance > 0.01 ? 'Deve Ricevere' : balance < -0.01 ? 'Deve Dare' : 'In Pari'}
          </p>
        </div>
      </button>

      {/* Dettaglio Espandibile */}
     {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-2">
          <h4 className="font-semibold text-sm text-gray-700">Dettaglio Saldo:</h4>
          {member.debts.length > 0 ? (
            <ul className="text-sm space-y-1">
              {member.debts.map(debt => (
                <li key={debt.otherMemberId} className="flex justify-between items-center">
                  <span className="text-gray-800">
                    {/* `debt.amount` è negativo se `member` deve soldi */}
                    {debt.amount < 0 
                      ? `Deve a ${debt.otherMemberName}` 
                      : `${debt.otherMemberName} gli deve`}
                  </span>
                  <span className={`font-medium ${debt.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {Math.abs(debt.amount).toFixed(2)} €
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">In pari con tutti i membri del gruppo.</p>
          )}
        </div>
      )}
    </li>
  );
}

export default function MembersTab({ groupId, initialMembers, isCurrentUserAdmin, totalBalance }: MembersTabProps) {
  const { user: currentUser } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedMember, setSelectedMember] = useState<ProcessedMember | null>(null);
  const queryClient = useQueryClient();

  // La logica di invito rimane invariata
  const inviteMutation = useMutation({
    mutationFn: (email: string) => api.inviteUserToGroup(groupId, { email }),
    onSuccess: () => {
      alert('Invito inviato con successo!'); 
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['group-details-processed', groupId] });
    },
    onError: (error) => {
      alert(`Errore nell'invio dell'invito: ${error.message}`);
    }
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate(inviteEmail.trim());
  };

  return (
    <div className="space-y-8">   
      {/* 2. Sezione Invito (mantenuta) */}
      {isCurrentUserAdmin && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Invita un nuovo membro</h3>
          <form onSubmit={handleInviteSubmit} className="flex flex-col sm:flex-row gap-2">
            <Input 
              type="email" 
              placeholder="email@esempio.com" 
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="w-full text-gray-500" 
              disabled={inviteMutation.isPending}
            />
            <Button 
              type="submit" 
              disabled={inviteMutation.isPending}
              className="w-full sm:w-auto"
            >
              {inviteMutation.isPending ? 'Invio...' : 'Invia Invito'}
            </Button>
          </form>
        </div>
      )}

      {/* 3. Ripristino della Lista dei Saldi Individuali */}
         <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Membri e Saldi del Gruppo</h3>
        <ul className="space-y-2">
           {initialMembers.map(member => (
          <MemberRow key={member.id} member={member} />
        ))}
        </ul>
      </div>


      {/* 4. Modale di Dettaglio (mantenuto) */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          groupId={groupId}
          onClose={() => setSelectedMember(null)}
          isCurrentUserAdmin={isCurrentUserAdmin}
        />
      )}
    </div>
  );
}