// Enum basato sul tuo diagramma (potrebbe essere più esteso)
export enum TipoNotifica {
  INVITO_GRUPPO = 'INVITO_GRUPPO',
  NUOVA_SPESA = 'NUOVA_SPESA',
  MODIFICA_SPESA = 'MODIFICA_SPESA',
  SALDO_RICHIESTO = 'SALDO_RICHIESTO',
  PAGAMENTO_RICEVUTO = 'PAGAMENTO_RICEVUTO',
  MEMBRO_AGGIUNTO = 'MEMBRO_AGGIUNTO',
  MEMBRO_RIMOSSO = 'MEMBRO_RIMOSSO',
  CAMBIO_AMMINISTRATORE = 'CAMBIO_AMMINISTRATORE',
  GENERALE = 'GENERALE', // Un tipo generico
}

export enum StatoInvito {
  PENDENTE = 'PENDENTE',
  ACCETTATO = 'ACCETTATO',
  RIFIUTATO = 'RIFIUTATO',
}

// Interfaccia per una notifica, basata sulla tua classe Notifica
export interface Notifica {
  idNotifica: number; // UUID
  tipo: TipoNotifica;
  messaggio: string;
  timestamp: string; // ISO date string per semplicità
  letta: boolean;
  linkCorrelato?: string; // URL opzionale per navigare al contesto
  // Campi specifici per tipo INVITO_GRUPPO
  idInvito?: number; // ID dell'invito da accettare/rifiutare
  nomeGruppo?: string; // Nome del gruppo a cui si è invitati
  statoInvito?: StatoInvito; // Per gestire lo stato dell'invito sulla UI
}

// Dati di mock per le notifiche
export const MOCK_NOTIFICATIONS: Notifica[] = [
  {
    idNotifica: 1,
    tipo: TipoNotifica.INVITO_GRUPPO,
    messaggio: "Giulia Rossi ti ha invitato al gruppo 'Grecia 2k25 vacanza sfascio porco dio'.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minuti fa
    letta: false,
    linkCorrelato: '/groups/vacanze-estive-2025', // Esempio
    idInvito: 12,
    nomeGruppo: 'Vacanze Estive 2024',
    statoInvito: StatoInvito.PENDENTE,
  },
  {
    idNotifica: 2,
    tipo: TipoNotifica.NUOVA_SPESA,
    messaggio: "Aggiunta nuova spesa 'Cena fuori' nel gruppo 'Coinquilini'.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 ore fa
    letta: false,
    linkCorrelato: '/groups/coinquilini/expenses/spesa-abc',
  },
  {
    idNotifica: 3,
    tipo: TipoNotifica.SALDO_RICHIESTO,
    messaggio: "Sam Nejati ha richiesto il saldo dei conti nel gruppo 'Progetto Università'.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 giorno fa
    letta: true,
  },
  {
    idNotifica: 4,
    tipo: TipoNotifica.GENERALE,
    messaggio: 'Benvenuto in [Nome Progetto]! Completa il tuo profilo.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 giorni fa
    letta: true,
    linkCorrelato: '/profile/settings',
  },
  {
    idNotifica: 5,
    tipo: TipoNotifica.INVITO_GRUPPO,
    messaggio: "Sara Tamanza ti ha invitato al gruppo 'Regalo Laurea'.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minuti fa
    letta: false,
    idInvito: 56,
    nomeGruppo: 'Regalo Laurea',
    statoInvito: StatoInvito.PENDENTE,
  },
];