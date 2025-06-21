// NON c'è 'use client' qui. Questo è un Server Component.
import GroupDetailClient from './groupDetailClient'; // Importa il nuovo componente

// Le props della pagina rimangono le stesse
interface GroupDetailPageProps {
  params: {
    groupId: string;
  };
}

// La funzione della pagina ora non ha bisogno di essere un client component
export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  // Leggiamo e parsiamo l'ID qui, nel Server Component.
  // Qui l'avviso non apparirà più perché questo è il posto giusto per fare questa operazione.
  const groupId = parseInt(params.groupId, 10);
  
  // Controlliamo se l'ID è valido prima di renderizzare il componente client
  if (isNaN(groupId)) {
    return <div>ID del gruppo non valido.</div>;
  }

  // Renderizziamo il nostro Client Component, passandogli l'ID come prop.
  return <GroupDetailClient groupId={groupId} />;
}