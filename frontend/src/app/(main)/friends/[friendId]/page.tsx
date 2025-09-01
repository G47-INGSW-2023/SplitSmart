import FriendDetailClient from './friendDetailClient';
import { use } from 'react'; 

interface FriendDetailPageProps {
  params: Promise<{
    friendId: string;
  }>;
}

export default function FriendDetailPage(props: FriendDetailPageProps) {
  const params = use(props.params);
  
  const friendId = parseInt(params.friendId, 10);
  
  if (isNaN(friendId)) {
    return <div>ID amico non valido.</div>;
  }

  return <FriendDetailClient friendId={friendId} />;
}