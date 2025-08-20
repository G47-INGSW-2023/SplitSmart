import FriendDetailClient from './friendDetailClient';
import { use } from 'react'; // Importa `use` da React

// Interfaccia per le props. `params` qui è una Promise
interface FriendDetailPageProps {
  params: Promise<{
    friendId: string;
  }>;
}

export default function FriendDetailPage(props: FriendDetailPageProps) {
  // `use` srotola la Promise in modo sincrono all'interno di un Server Component
  const params = use(props.params);
  
  const friendId = parseInt(params.friendId, 10);
  
  if (isNaN(friendId)) {
    return <div>ID amico non valido.</div>;
  }

  return <FriendDetailClient friendId={friendId} />;
}