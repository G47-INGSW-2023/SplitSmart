'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { User } from '@/types';
import { Button } from '@/component/ui/button';
import { Input } from '@/component/ui/input';
import { useState } from 'react';
import MemberDetailModal from './memberDetailModal'; // Importiamo il nuovo modale

interface MembersTabProps {
  groupId: number;
}

export default function MembersTab({ groupId }: MembersTabProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  const queryClient = useQueryClient();

  const { data: members, isLoading, isError } = useQuery<User[]>({
    queryKey: ['members', groupId],
    queryFn: () => api.getGroupMembers(groupId),
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) => api.inviteUserToGroup(groupId, { email }),
    
    onSuccess: () => {
      alert('Invito inviato con successo!'); 
      setInviteEmail('');
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


  if (isLoading) return <div>Caricamento membri...</div>;
  if (isError) return <div>Errore nel caricamento dei membri.</div>;

  return (
    <div className="space-y-8">
      {/* Sezione Invito */}
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
            {inviteMutation.isPending ? 'Invio in corso...' : 'Invia Invito'}
          </Button>
        </form>
        {/* Potremmo mostrare un errore direttamente sotto il form, ma l'alert è sufficiente per ora */}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Membri del gruppo</h3>
        <ul className="space-y-2">
          {members?.map(member => (
            <li key={member.id}>
              <button
                onClick={() => setSelectedMember(member)}
                className="w-full bg-white p-4 rounded-lg shadow-sm flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
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
        />
      )}
    </div>
  );
}