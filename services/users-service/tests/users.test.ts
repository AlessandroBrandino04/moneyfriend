import request from 'supertest';
import app from '../src/app'; // Importiamo l'app Express configurata
import { PrismaClient } from '@prisma/client';
import { UsersService } from '../src/services/users.service';

const prisma = new PrismaClient();
const usersService = new UsersService();

describe('Users Service API', () => {
  
  // Pulizia opzionale: prima di tutti i test, potresti voler svuotare il DB
  // o connetterti a un DB di test specifico.
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Importante: chiudere la connessione Prisma alla fine
    
    await prisma.$disconnect();
  });

  // --- TEST DI REGISTRAZIONE ---
    describe('POST /api/users/register', () => {
        let successfulUserData: any = {}; // Dati per l'utente registrato con successo

        it('should register a new user successfully (Status 201)', async () => {
            const randomId = Math.floor(Math.random() * 10000);
            successfulUserData = { // Salviamo i dati per usarli nel cleanup
                email: `testsuccess${randomId}@example.com`,
                password: 'passwordSegreta123!',
                nickname: `tester${randomId}`,
                name: 'Test',
                surname: 'User'
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(successfulUserData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('should fail if email is missing (Status 400)', async () => {
            const response = await request(app)
                .post('/api/users/register')
                .send({
                    password: 'password123',
                    name: 'NoEmail'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        // 🆕 TEST: Email già in uso
        it('should fail to register if email is already in use (Status 409/400)', async () => {
            // L'utente è già stato creato nel test precedente (successfulUserData)
            // Se il tuo controller restituisce 409 Conflict, usa 409. Se usa 400 Bad Request, usa 400.
            const response = await request(app)
                .post('/api/users/register')
                .send(successfulUserData);

            // Ho usato 400 come fallback, ma 409 è spesso più appropriato per i conflitti
            expect([400, 409]).toContain(response.status); 
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Email already in use'); // Verifica il messaggio
        });

        // 🧹 PULIZIA: Elimina l'utente creato nel primo test
        afterAll(async () => {
            if (successfulUserData.email) {
                // Assicurati che l'utente sia stato effettivamente creato prima di provare a eliminarlo
                await prisma.user.deleteMany({ where: { email: successfulUserData.email } });
            }
        });
    });

  // --- TEST DI LOGIN ---
    describe('POST /api/users/login', () => {
        let testUser: { email: string, password: string }; // Dati per l'utente di login

        // Crea l'utente una volta prima di tutti i test di login
        beforeAll(async () => {
            const randomId = Math.floor(Math.random() * 10000);
            
            testUser = { 
                email: `logintest${randomId}@example.com`,
                password: 'PasswordDiLogin123!'
            };

            //Usa l'istanza usersService per hashPassword
            const hashedPassword = await (usersService as any).hashPassword(testUser.password); 

            // Creazione Diretta nel DB
            await prisma.user.create({ 
                data: {
                    email: testUser.email,
                    passwordHash: hashedPassword, 
                    nickname: `loginTester${randomId}`,
                    name: 'Login',
                    surname: 'Tester'
                }
            });
        });

        //Pulisce l'utente una volta dopo tutti i test di login
        afterAll(async () => {
            await prisma.user.delete({ where: { email: testUser.email } });
        });
        
        // Test 1: Login con successo
        it('should login an existing user successfully and return a token (Status 200)', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: testUser.email,
                    password: testUser.password 
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user.email).toBe(testUser.email);
        });

        // Test 2: Password errata
        it('should fail to login with incorrect password (Status 401)', async () => {
             const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: testUser.email,
                    password: 'passwordSbagliata!' 
                });
                
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    // --- TEST DI MODIFICA UTENTE ---
    describe('PUT /api/users/me (Microservice Integration)', () => {
        let testUser: { email: string, password: string, id: string }; // Aggiungiamo 'id'
        
        // Crea l'utente una volta prima di tutti i test di modifica
        beforeAll(async () => {
            const randomId = Math.floor(Math.random() * 10000);
            
            testUser = { 
                email: `modifytest${randomId}@example.com`,
                password: 'PasswordDiLogin123!',
                id: '' // Sarà popolato dopo la creazione
            };

            const hashedPassword = await (usersService as any).hashPassword(testUser.password); 

            // Creazione Diretta nel DB
            const createdUser = await prisma.user.create({ 
                data: {
                    email: testUser.email,
                    passwordHash: hashedPassword, 
                    nickname: `modifyTester${randomId}`,
                    name: 'Initial',
                    surname: 'Data',
                    isDeleted: false // Assicuriamo che sia presente se non ha default
                }
            });
            // 🚨 Salviamo l'ID generato da Prisma per usarlo nel test
            testUser.id = createdUser.id; 
        });

        // 1. Test di Successo (Simula la richiesta dal Gateway)
        it('should update user details successfully using x-user-id header (Status 200)', async () => {
            
            
            const newDetails = {
                name: 'NomeModificato',
                surname: 'CognomeModificato',
                // Non aggiorniamo l'ID, solo i dettagli
            };

            const updateResponse = await request(app)
                .put(`/api/users/me`) // Usiamo /me o /users/id (solo per routing)
                // 🏆 Questo simula l'ID verificato dal JWT del Gateway
                .set('x-user-id', testUser.id) 
                .send(newDetails);

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.name).toBe(newDetails.name);
            expect(updateResponse.body.data.surname).toBe(newDetails.surname);

            // Verifica che il nickname non sia cambiato
            expect(updateResponse.body.data.email).toBe(testUser.email); 
        });
        
        // 2. Test di Sicurezza (Zero Trust - Simula un bypass)
        it('should fail if x-user-id header is missing (Zero Trust Check) (Status 401)', async () => {
             
            // Tentiamo di accedere alla rotta protetta SENZA l'header x-user-id
            const response = await request(app)
                .put(`/api/users/me`) 
                // ❌ NON impostiamo l'header x-user-id ❌
                .send({ name: 'Hacker Attempt' });
            
            // L'aspettativa è che il controller Utenti restituisca 401 (Zero Trust)
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });


        //Pulisce l'utente una volta dopo tutti i test di modifica
        afterAll(async () => {
            await prisma.user.delete({ where: { email: testUser.email } });
        });
    });
});