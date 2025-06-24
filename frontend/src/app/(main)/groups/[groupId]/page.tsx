import GroupDetailClient from './groupDetailClient';

interface GroupDetailPageProps {
  params: {
    groupId: string;
  };
}

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  const groupId = parseInt(params.groupId, 10);
  
  if (isNaN(groupId)) {
    return <div>ID del gruppo non valido.</div>;
  }

  return <GroupDetailClient groupId={groupId} />;
}