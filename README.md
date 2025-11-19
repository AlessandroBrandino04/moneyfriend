
Questo progetto è un esempio di backend moderno progettato per gestire la logica di applicazioni che coordinano spese e transazioni tra gruppi di persone. L'obiettivo è mostrare competenze pratiche nell'architettura a microservizi, nello sviluppo con TypeScript e nella containerizzazione con Docker.

Nel repository troverai un'implementazione di riferimento che mette in evidenza:
- progettazione di API REST con Express e TypeScript;
- separazione dei compiti mediante microservizi (`users-service`, `payments-service`) e un `api-gateway` per routing e autenticazione centrale;
- gestione sicura delle credenziali e dei token JWT;
- orchestrazione locale tramite `docker-compose` e build Docker multi-stage per immagini più leggere e riproducibili;
- uso di Prisma per migrazioni e accesso al database con modelli forti in TypeScript.

Questa soluzione è pensata per essere estesa: il codice è organizzato per facilitare l'aggiunta di endpoint, la scrittura di test e l'integrazione con servizi di terze parti (pagamenti, notifiche realtime, ecc.).


