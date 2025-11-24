import { Router } from 'express';
import { sendFriendRequest, acceptFriendRequest, listFriends, listRequests, getFriendDetail, deleteFriend } from '../controllers/friendship.controller';

const router = Router();

// Invia una richiesta d'amicizia usando il nickname del target
router.post('/friend-request', sendFriendRequest);

// Accetta una richiesta (id della friendship)
router.post('/friend-request/:id/accept', acceptFriendRequest);

// Lista amici dell'utente autenticato
router.get('/friends', listFriends);
// Elimina un'amicizia (richiesto essere uno dei due partecipanti)
router.delete('/friendship/:id', deleteFriend);
router.get('/friend-details/:id', getFriendDetail); // Fetch friend detail by ID

// Lista richieste per status: /api/users/friend-requests?status=PENDING|ACCEPTED|BLOCKED
router.get('/friend-requests', listRequests);


export default router;
