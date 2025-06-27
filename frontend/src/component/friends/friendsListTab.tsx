'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { EnrichedFriend } from '@/types';

export default function FriendsListTab() {
  const { user: currentUser } = useAuth();
  
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

  if (isLoading) return <p>Caricamento lista amici...</p>;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {friends && friends.length > 0 ? (
        <ul>
          {friends.map(friend => (
            <li key={friend.id} className="p-4 border-b last:border-b-0">
              <p className="font-medium text-gray-800">{friend.username}</p>
              <p className="text-sm text-gray-500">{friend.email}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-10 text-center text-gray-500">Non hai ancora nessun amico. Aggiungine uno dalla tab apposita!</p>
      )}
    </div>
  );
}