// Questo sarà un Server Component che passa l'ID al Client Component
import FriendDetailClient from './friendDetailClient';

interface FriendDetailPageProps {
  params: { friendId: string };
}

export default function FriendDetailPage({ params }: FriendDetailPageProps) {
  const friendId = parseInt(params.friendId, 10);
  if (isNaN(friendId)) return <div>ID amico non valido.</div>;
  return <FriendDetailClient friendId={friendId} />;
}