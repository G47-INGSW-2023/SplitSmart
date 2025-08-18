'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EnrichedFriend } from '@/types';
import { Modal } from '@/component/ui/modal';
import { Input } from '@/component/ui/input';
import { Button } from '@/component/ui/button';
import { useAuth } from '@/lib/authContext';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  currentMemberIds: number[]; // ID dei membri già nel gruppo
}

export default function AddMemberModal({ isOpen, onClose, groupId, currentMemberIds }: AddMemberModalProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Recupera la lista degli amici
  const { data: friends, isLoading: isLoadingFriends } = useQuery<EnrichedFriend[]>({
    queryKey: ['friends-list-for-add', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];

      const friendships = await api.getFriends();
      const friendIds = friendships.map(f => 
        f.user1 === currentUser.id ? f.user2 : f.user1
      );
      const friendDetailsPromises = friendIds.map(async (id) => {
        const userDetails = await api.getUserDetails(id);
        const friend: EnrichedFriend = {
          id: id, 
          username: userDetails.username,
          email: userDetails.email,
        };
        return friend;
      });

      return Promise.all(friendDetailsPromises);
    },
    enabled: !!currentUser,
  });



  // Mutazione per invitare via email
  const inviteMutation = useMutation({
    mutationFn: (email: string) => api.inviteUserToGroup(groupId, { email }),
    onSuccess: () => {
      alert('Invito inviato con successo!');
      setInviteEmail('');
    },
    onError: (error) => alert(`Errore: ${error.message}`),
  });

  // Mutazione per aggiungere un amico direttamente
  const addFriendMutation = useMutation({
    mutationFn: (userId: number) => api.addMemberToGroup(groupId, userId),
    onSuccess: (data, userId) => {
      alert(`Amico aggiunto al gruppo!`);
      // Invalidiamo la query principale per aggiornare la lista dei membri in background
      queryClient.invalidateQueries({ queryKey: ['group-details-simplified', groupId] });
    },
    onError: (error, userId) => alert(`Errore nell'aggiunta dell'amico: ${error.message}`),
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate(inviteEmail);
  };
  
  // Filtra gli amici che non sono già nel gruppo
  const friendsToAdd = useMemo(() => {
    if (!friends) return [];
    const memberIdSet = new Set(currentMemberIds);
    return friends.filter(friend => !memberIdSet.has(friend.id));
  }, [friends, currentMemberIds]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Aggiungi Membri al Gruppo">
      <div className="space-y-6">
        {/* Sezione Invito via Email */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Invita tramite Email</h4>
          <form onSubmit={handleInviteSubmit} className="flex gap-2">
            <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@esempio.com" required disabled={inviteMutation.isPending} />
            <Button type="submit" disabled={inviteMutation.isPending}>{inviteMutation.isPending ? 'Invio...' : 'Invia'}</Button>
          </form>
        </div>

        {/* Sezione Aggiungi Amici */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-800 mb-2">Aggiungi dalla tua lista amici</h4>
          {isLoadingFriends ? <p>Caricamento amici...</p> : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {friendsToAdd.map(friend => (
                <li key={friend.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{friend.username}</p>
                    <p className="text-sm text-gray-500">{friend.email}</p>
                  </div>
                  <Button
                    onClick={() => addFriendMutation.mutate(friend.id)}
                    disabled={addFriendMutation.isPending && addFriendMutation.variables === friend.id}
                  >
                    {addFriendMutation.isPending && addFriendMutation.variables === friend.id ? '...' : '+ Aggiungi'}
                  </Button>
                </li>
              ))}
              {friendsToAdd.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Tutti i tuoi amici sono già in questo gruppo.</p>}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}