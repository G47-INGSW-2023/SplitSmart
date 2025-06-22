'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { User, GroupMember, MemberDetails } from '@/types'; 
import { Button } from '@/component/ui/button';
import { Input } from '@/component/ui/input';
import { useState } from 'react';
import MemberDetailModal from './memberDetailModal'; // Importiamo il nuovo modale
import { useAuth } from '@/lib/authContext'; // 1. Assicurati che useAuth sia importato

interface MembersTabProps {
 groupId: number;
  initialMembers: (MemberDetails & { balance: number })[];
  isCurrentUserAdmin: boolean;
  totalBalance: number;
}

export default function MembersTab({ groupId, initialMembers, isCurrentUserAdmin, totalBalance }: MembersTabProps) {
  const { user: currentUser } = useAuth(); 
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberDetails | null>(null);
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: (email: string) => api.inviteUserToGroup(groupId, { email }),
    onSuccess: () => {
      alert('Invito inviato con successo!'); 
      setInviteEmail('');
      // Invalidiamo la query principale per aggiornare la lista membri
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
      {/* Sezione Invito */}
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
              {inviteMutation.isPending ? 'Invio...' : 'Invita'}
            </Button>
          </form>
        </div>
      )}

     <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Membri e Saldi</h3>
        <ul className="space-y-2">
          {initialMembers
            .sort((a, b) => {
              if (a.id === currentUser?.id) return -1;
              if (b.id === currentUser?.id) return 1;
              return a.username.localeCompare(b.username);
            })
            .map(member => {
              const isSelf = member.id === currentUser?.id;

              // --- LOGICA DI VISUALIZZAZIONE AGGIORNATA ---
              if (isSelf) {
                // Renderizzazione speciale per l'utente corrente
                const totalBalanceColor = totalBalance >= 0 ? 'text-green-600' : 'text-red-600';
                return (
                  <li key={member.id} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">
                        {member.username} (Tu)
                      </span>
                      <div className={`text-right ${totalBalanceColor}`}>
                        <p className="text-xs">Saldo Totale</p>
                        <p className="font-bold text-lg">
                          {totalBalance >= 0 ? '+' : ''}{totalBalance.toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  </li>
                );
              } else {
                // Renderizzazione standard per gli altri membri
                const balance = member.balance;
                const balanceColor = balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-500';
                return (
                  <li key={member.id}>
                    <button
                      onClick={() => setSelectedMember(member)}
                      className="w-full bg-white p-4 rounded-lg shadow-sm flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{member.username}</span>
                      <div className={`text-right ${balanceColor}`}>
                        <p className="text-xs">
                          {balance > 0 ? 'Ti deve' : balance < 0 ? 'Gli devi' : 'In pari'}
                        </p>
                        <p className="font-semibold">{balance.toFixed(2)} €</p>
                      </div>
                    </button>
                  </li>
                );
              }
            })}
        </ul>
      </div>

      {/* Il modale di dettaglio membro. Viene mostrato solo se `selectedMember` non è null. */}
       {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          groupId={groupId}
          onClose={() => setSelectedMember(null)}
          isCurrentUserAdmin={isCurrentUserAdmin} // Passiamo l'informazione al modale
        />
      )}
    </div>
  );
}