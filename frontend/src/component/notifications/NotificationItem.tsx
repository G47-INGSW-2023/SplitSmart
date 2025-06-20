// 'use client'; // Se ha interazioni client-side dirette non gestite dal padre

import { Button } from '@/component/ui/button'; // Assicurati che il percorso sia corretto
import { Notifica, TipoNotifica, StatoInvito } from './NotificationPage'; // Adatta il percorso se separi i tipi
import { useRouter } from 'next/navigation'; // Per la navigazione

interface NotificationItemProps {
  notification: Notifica;
  onMarkAsRead: (id: string) => void;
  onAcceptInvite: (idNotifica: string, idInvito?: string, nomeGruppo?: string) => void;
  onDeclineInvite: (idNotifica: string, idInvito?: string, nomeGruppo?: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onAcceptInvite,
  onDeclineInvite,
}) => {
  const router = useRouter();

  const handleItemClick = () => {
    if (!notification.letta) {
      onMarkAsRead(notification.idNotifica);
    }
    if (notification.linkCorrelato) {
      router.push(notification.linkCorrelato);
    }
  };

  const formattedTimestamp = new Date(notification.timestamp).toLocaleString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`p-4 border-b border-gray-200 last:border-b-0 ${
        !notification.letta ? 'bg-blue-50' : 'bg-white'
      } hover:bg-gray-50 transition-colors`}
    >
      <div className="flex flex-row items-start">
        <div 
          className={`flex-grow ${notification.linkCorrelato ? 'cursor-pointer' : ''} basis-10/12`}
          onClick={notification.linkCorrelato ? handleItemClick : undefined}
        >
          <p className={`text-sm ${!notification.letta ? 'font-semibold' : 'font-normal'} text-gray-800`}>
            {notification.messaggio}
          </p>
          <p className="text-xs text-gray-500 mt-1">{formattedTimestamp}</p>
        </div>
        {!notification.letta && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.idNotifica);
            }}
            title="Segna come letta"
            className="basis-1/6"
          >
            {/* Potresti usare un'icona qui */}
            ✓
          </Button>
        )}
      </div>

      {/* Azioni specifiche per tipo di notifica */}
      {notification.tipo === TipoNotifica.INVITO_GRUPPO && notification.statoInvito === StatoInvito.PENDENTE && (
        <div className="mt-3 flex space-x-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAcceptInvite(notification.idNotifica, notification.idInvito, notification.nomeGruppo);
            }}
          >
            Accetta Invito
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDeclineInvite(notification.idNotifica, notification.idInvito, notification.nomeGruppo);
            }}
          >
            Rifiuta
          </Button>
        </div>
      )}
       {notification.tipo === TipoNotifica.INVITO_GRUPPO && notification.statoInvito === StatoInvito.ACCETTATO && (
        <p className="mt-2 text-xs text-green-600">Invito accettato.</p>
      )}
      {notification.tipo === TipoNotifica.INVITO_GRUPPO && notification.statoInvito === StatoInvito.RIFIUTATO && (
        <p className="mt-2 text-xs text-red-600">Invito rifiutato.</p>
      )}
    </div>
  );
};