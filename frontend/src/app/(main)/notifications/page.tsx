'use client';

import { Button } from '@/component/ui/button'; // Assicurati che il percorso sia corretto
import { Notifica, StatoInvito, MOCK_NOTIFICATIONS } from '@/component/notifications/NotificationPage'; // Adatta i percorsi
import { NotificationList } from '@/component/notifications/NotificationList'; // Adatta i percorsi

import { useState, useEffect } from 'react';

// Simula una chiamata API per caricare le notifiche
const fetchNotifications = async (): Promise<Notifica[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Ordina per timestamp più recente prima
      const sortedNotifications = [...MOCK_NOTIFICATIONS].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      resolve(sortedNotifications);
    }, 500); // Simula un piccolo ritardo di rete
  });
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notifica[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true);
      const fetchedNotifications = await fetchNotifications();
      setNotifications(fetchedNotifications);
      setIsLoading(false);
    };
    loadNotifications();
  }, []);

  // Handler per segnare una notifica come letta
  const handleMarkAsRead = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) =>
        notif.idNotifica === id ? { ...notif, letta: true } : notif
      )
    );
    // TODO: Chiamata API per segnare come letta sul backend
    console.log(`Notifica ${id} segnata come letta.`);
  };

  // Handler per segnare tutte le notifiche come lette
  const handleMarkAllAsRead = () => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) => ({ ...notif, letta: true }))
    );
    // TODO: Chiamata API per segnare tutte come lette sul backend
    console.log('Tutte le notifiche segnate come lette.');
  };
  
  // Handler per accettare un invito
  const handleAcceptInvite = (idNotifica: string, idInvito?: string, nomeGruppo?: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) =>
        notif.idNotifica === idNotifica ? { ...notif, statoInvito: StatoInvito.ACCETTATO, letta: true } : notif
      )
    );
    // TODO: Chiamata API per accettare l'invito
    console.log(`Invito ${idInvito} per il gruppo '${nomeGruppo}' accettato (notifica ${idNotifica}).`);
    // Potrebbe essere utile un feedback all'utente (es. toast notification)
  };

  // Handler per rifiutare un invito
  const handleDeclineInvite = (idNotifica: string, idInvito?: string, nomeGruppo?: string) => {
     setNotifications((prevNotifications) =>
      prevNotifications.map((notif) =>
        notif.idNotifica === idNotifica ? { ...notif, statoInvito: StatoInvito.RIFIUTATO, letta: true } : notif
      )
    );
    // TODO: Chiamata API per rifiutare l'invito
    console.log(`Invito ${idInvito} per il gruppo '${nomeGruppo}' rifiutato (notifica ${idNotifica}).`);
  };

  const unreadCount = notifications.filter(notif => !notif.letta).length;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Notifiche</h1>
        </div>
        <p className="text-center py-10 text-gray-500">Caricamento notifiche...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-4xl mx-auto"> {/* Aggiunto padding e max-width per miglior layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"> {/* Responsive flex */}
        <div className='flex flex-row w-full'>
          <h1 className="text-3xl font-bold text-gray-800 basis-1/2">Notifiche</h1> {/* Titolo più grande */}
          {notifications.length > 0 && unreadCount > 0 && (
            <Button 
              onClick={handleMarkAllAsRead}
              className='basis-1/2'
            >
              Segna tutte come lette ({unreadCount})
            </Button>
          )}
        </div>
      </div>
      
      <NotificationList 
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onAcceptInvite={handleAcceptInvite}
        onDeclineInvite={handleDeclineInvite}
      />
    </div>
  );
}