// 'use client'; // Se ha interazioni client-side dirette non gestite dal padre

import { Button } from '@/component/ui/button'; // Assicurati che il percorso sia corretto
import { Notifica, TipoNotifica, StatoInvito } from './NotificationPage'; // Adatta il percorso se separi i tipi
import { useRouter } from 'next/navigation'; // Per la navigazione
import { Notific } from '@/types';

interface NotificationItemProps {
  notification: Notifica;
  onMarkAsRead: (id: string) => void; // L'ID ora è una stringa
  onAcceptInvite: (id: string, inviteId?: number) => void;
  onDeclineInvite: (id: string, inviteId?: number) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead, onAcceptInvite, onDeclineInvite }) => {
  const router = useRouter();

  // Il backend non fornisce un link, ma potremmo costruirlo in futuro
  // basandoci su `notification_type` e `referenced_object`.
  // Esempio: const link = `/groups/${notification.referenced_object}`;
  const linkCorrelato = null;

  const handleItemClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (linkCorrelato) {
      router.push(linkCorrelato);
    }
  };

  const formattedTimestamp = new Date(notification.creation_date).toLocaleString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div
      className={`p-4 border-b border-gray-200 last:border-b-0 ${!notification.read ? 'bg-blue-50' : 'bg-white'} hover:bg-gray-50 transition-colors`}
    >
      <div className="flex items-start gap-4">
        <div 
          className={`flex-grow ${linkCorrelato ? 'cursor-pointer' : ''}`}
          onClick={linkCorrelato ? handleItemClick : undefined}
        >
          {/* Mostra il messaggio reale dal backend */}
          <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-normal'} text-gray-800`}>
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1">{formattedTimestamp}</p>
        </div>
        {/* Mostra il pulsante "leggi" solo se la notifica non è letta */}
        {!notification.read && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            title="Segna come letta"
            className="flex-shrink-0"
          >
            ✓
          </Button>
        )}
      </div>
      {/* Rimuoviamo completamente la logica per gli inviti, perché ora è separata */}
        {notification.tipo === TipoNotifica.INVITO_GRUPPO && notification.statoInvito === StatoInvito.PENDENTE && (
        <div className="mt-3 flex space-x-2">
          <Button onClick={() => onAcceptInvite(notification.id, notification.idInvito)}>Accetta</Button>
          <Button variant="secondary" onClick={() => onDeclineInvite(notification.id, notification.idInvito)}>Rifiuta</Button>
        </div>
      )}
      {notification.statoInvito === StatoInvito.ACCETTATO && (
        <p className="mt-2 text-xs text-green-600">Invito accettato.</p>
      )}
      {notification.statoInvito === StatoInvito.RIFIUTATO && (
        <p className="mt-2 text-xs text-red-600">Invito rifiutato.</p>
      )}
    </div>
    
  );
};