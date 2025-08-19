'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { EnrichedFriend } from '@/types';
import { Button } from '@/component/ui/button'; 
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function FriendsListTab() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: friends, isLoading } = useQuery<EnrichedFriend[]>({
    queryKey: ['friends-list', currentUser?.id], 
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

   const removeFriendMutation = useMutation({
    mutationFn: (friendId: number) => api.removeFriend(friendId),
    onSuccess: () => {
      // Se la rimozione ha successo, invalida la cache della lista amici
      // per forzare un ri-caricamento e aggiornare la UI.
      queryClient.invalidateQueries({ queryKey: ['friends-list', currentUser?.id] });
      alert("Amico rimosso con successo.");
    },
    onError: (error) => {
      alert(`Errore: ${error.message}`);
    }
  });

  
  if (isLoading) return <p>Caricamento lista amici...</p>;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {friends && friends.length > 0 ? (
        <ul>
          {friends.map(friend => (
            <li key={friend.id}>
              <Link
                href={`/friends/${friend.id}`}
                className="block bg-white p-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-800">{friend.username}</p>
                <p className="text-sm text-gray-500">{friend.email}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-10 text-center text-gray-500">Non hai ancora nessun amico.</p>
      )}
    </div>
  );
}