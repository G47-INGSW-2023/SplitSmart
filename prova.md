### Testing

Di seguito sono definiti i casi di test essenziali per verificare le funzionalità principali del backend. Ogni caso di test corrisponde a una richiesta API che può essere automatizzata per garantire la stabilità e la correttezza dell'applicazione.

#### Area di Test 1: Autenticazione e Gestione Utenti (Modulo: `api/users.rs`)

| Test Case ID | Descrizione | Endpoint / Azione | Dati di Test (Input) | Precondizioni | Risultato Atteso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | **Happy Path:** Creazione di un account in modo corretto. | `POST /user/register` | `RegisterRequest` con `username` e `email` unici, e una `password` valida. | Nessuna. Il database è pulito. | **Status:** `200 OK`. <br> **DB:** Un nuovo utente viene creato nella tabella `users` con la password correttamente hashata. |
| **AUTH-02** | **Conflitto:** Creazione di un account con un'email già esistente. | `POST /user/register` | `RegisterRequest` con un'`email` già presente nel DB. | Un utente con la stessa email è già registrato. | **Status:** `409 Conflict`. <br> **DB:** Nessun nuovo utente viene creato. |
| **AUTH-03** | **Login Corretto:** Login con credenziali valide. | `POST /user/login` | `LoginRequest` con `email` e `password` di un utente esistente. | L'utente è registrato e il suo account è attivo. | **Status:** `200 OK`. <br> **Response:** Un cookie `session_id` viene impostato. Il body contiene lo `user.id`. |
| **AUTH-04** | **Login Fallito:** Login con password errata. | `POST /user/login` | `LoginRequest` con `email` corretta ma `password` errata. | L'utente è registrato. | **Status:** `401 Unauthorized`. |
| **AUTH-05** | **Logout:** Logout di un utente autenticato. | `POST /user/logout` | Nessuno. | L'utente ha un cookie `session_id` valido. | **Status:** `200 OK`. <br> **Response:** Il cookie `session_id` viene rimosso. |

#### Area di Test 2: Gestione Gruppi e Membri (Modulo: `api/groups.rs`)

| Test Case ID | Descrizione | Endpoint / Azione | Dati di Test (Input) | Precondizioni | Risultato Atteso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GRP-01** | **Happy Path:** Creazione di un nuovo gruppo. | `POST /groups/` | `PutGroup` con `name` e `description`. | L'utente (creatore) è loggato. | **Status:** `200 OK`. <br> **DB:** 1) Creato un record in `groups`. 2) Il creatore è aggiunto a `group_members`. 3) Il creatore è aggiunto a `group_administrators`. |
| **GRP-02** | **Invito:** Un admin invita un altro utente nel gruppo. | `POST /groups/{gid}/members/invite` | `InviteUser` con l'`email` di un utente esistente. | Utente A (loggato) è admin del gruppo `{gid}`. Utente B (con l'email data) esiste. | **Status:** `200 OK`. <br> **DB:** Un nuovo record viene creato in `group_invites` con stato "PENDING". |
| **GRP-03** | **Accesso Negato:** Un non-admin prova a invitare un utente. | `POST /groups/{gid}/members/invite` | `InviteUser` con un'email. | Utente A (loggato) è membro del gruppo `{gid}` ma **non** è admin. | **Status:** `401 Unauthorized` (come da funzione `is_admin`). |
| **GRP-04** | **Accettazione Invito:** Un utente accetta un invito a un gruppo. | `PUT /user/invites/{invite_id}/accept` | Nessuno (ID nell'URL). | Utente B (loggato) ha un invito pendente con ID `{invite_id}`. | **Status:** `200 OK`. <br> **DB:** 1) L'invito in `group_invites` è impostato su "ACCEPTED". 2) Utente B è aggiunto alla tabella `group_members`. |
| **GRP-05** | **Rimozione Membro:** Un admin rimuove un membro dal gruppo. | `DELETE /groups/{gid}/members/{uid}` | Nessuno (ID nell'URL). | Utente A (loggato) è admin. Utente B (con ID `{uid}`) è membro. | **Status:** `200 OK`. <br> **DB:** Il record di Utente B viene rimosso da `group_members` (e da `group_administrators` se presente). |

#### Area di Test 3: Gestione Spese (Modulo: `api/groups.rs`)

| Test Case ID | Descrizione | Endpoint / Azione | Dati di Test (Input) | Precondizioni | Risultato Atteso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EXP-01** | **Happy Path:** Aggiunta di una spesa valida con divisione equa. | `POST /groups/{gid}/expenses` | `PutExpense` con `total_amount: 100`, `paid_by: userA_id`, `division: [(userA_id, 50), (userB_id, 50)]`. | Utente A è loggato. Utente A e B sono membri del gruppo `{gid}`. | **Status:** `200 OK`. <br> **DB:** Creato un record in `expenses`, due record in `expense_participations`, e due notifiche in `notifications`. |
| **EXP-02** | **Dati Invalidi:** Aggiunta di spesa con divisione non corretta. | `POST /groups/{gid}/expenses` | `PutExpense` con `total_amount: 100` ma la somma delle `division` è 90. | Come EXP-01. | **Status:** `400 Bad Request`. <br> **Nota:** Il tuo codice ha un `TODO` per questa validazione. Questo test fallirà finché la logica non sarà implementata, evidenziandone l'importanza. |
| **EXP-03** | **Cancellazione Spesa:** Un admin o il creatore cancella una spesa. | `DELETE /groups/{gid}/expenses/{exid}` | Nessuno. | L'utente loggato è l'admin del gruppo o l'utente che ha creato la spesa `{exid}`. | **Status:** `200 OK`. <br> **DB:** La spesa viene rimossa. Vengono create notifiche di cancellazione. |
| **EXP-04** | **Accesso Negato:** Un utente non autorizzato prova a cancellare una spesa. | `DELETE /groups/{gid}/expenses/{exid}` | Nessuno. | L'utente loggato non è né l'admin né il creatore della spesa. | **Status:** `500 Internal Server Error` (a causa del `RollbackTransaction`). Un test migliore punterebbe a un `403 Forbidden`. |

#### Area di Test 4: Gestione Amicizie (Modulo: `api/friends.rs`)

| Test Case ID | Descrizione | Endpoint / Azione | Dati di Test (Input) | Precondizioni | Risultato Atteso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FRND-01** | **Invito:** Un utente invia una richiesta di amicizia a un altro. | `POST /friends/invites` | `InviteUser` con l'email di Utente B. | Utente A (loggato) e Utente B esistono e non sono amici. | **Status:** `200 OK`. <br> **DB:** Un record viene creato in `friend_invites`. |
| **FRND-02** | **Accettazione Invito:** Un utente accetta una richiesta di amicizia. | `PUT /friends/invites/{invite_id}/accept` | Nessuno. | Utente B (loggato) ha un invito pendente da Utente A con ID `{invite_id}`. | **Status:** `200 OK`. <br> **DB:** 1) L'invito in `friend_invites` è "ACCEPTED". 2) Un nuovo record viene creato in `friendships` tra Utente A e B. |
| **FRND-03** | **Rifiuto Invito:** Un utente rifiuta una richiesta di amicizia. | `PUT /friends/invites/{invite_id}/reject` | Nessuno. | Utente B (loggato) ha un invito pendente. | **Status:** `200 OK`. <br> **DB:** L'invito in `friend_invites` è impostato su "REJECTED". La tabella `friendships` non viene modificata. |
