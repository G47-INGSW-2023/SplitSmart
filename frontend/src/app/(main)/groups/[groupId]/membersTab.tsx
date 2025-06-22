'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { User, GroupMember, MemberDetails } from '@/types'; 
import { Button } from '@/component/ui/button';
import { Input } from '@/component/ui/input';
import { useState } from 'react';
import MemberDetailModal from './memberDetailModal'; // Importiamo il nuovo modale

interface MembersTabProps {
  groupId: number;
  initialMembers: MemberDetails[];
  isCurrentUserAdmin: boolean;
}


export default function MembersTab({ groupId, initialMembers, isCurrentUserAdmin }: MembersTabProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberDetails | null>(null);
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: (email: string) => api.inviteUserToGroup(groupId, { email }),     
    
onSuccess: () => {
      alert('Invito inviato con successo!'); 
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['group-details', groupId] });
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
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Membri del gruppo</h3>
        <ul className="space-y-2">
          {initialMembers.map(member => (
            <li key={member.id}>
              <button
                onClick={() => setSelectedMember(member)}
                className="w-full bg-white p-4 rounded-lg shadow-sm flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">{member.username}</span>
                  <span className="text-sm text-gray-500">{member.email}</span>
                </div>
                {member.isAdmin && (
                  <span className="text-xs font-semibold text-white bg-blue-500 px-2 py-1 rounded-full">
                    Admin
                  </span>
                )}
              </button>
            </li>
          ))}
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