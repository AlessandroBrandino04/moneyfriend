import { Router } from 'express';
import { sendFriendRequest, acceptFriendRequest, listFriends, listRequests } from '../controllers/friendship.controller';

const router = Router();

// Invia una richiesta d'amicizia usando il nickname del target
router.post('/friend-request', sendFriendRequest);

// Accetta una richiesta (id della friendship)
router.post('/friend-request/:id/accept', acceptFriendRequest);

// Lista amici dell'utente autenticato
router.get('/friends', listFriends);

// Lista richieste per status: /api/users/friend-requests?status=PENDING|ACCEPTED|BLOCKED
router.get('/friend-requests', listRequests);


export default router;
