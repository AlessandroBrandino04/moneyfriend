import { Router } from 'express';
import { joinGroup, ownerAddMember } from '../controllers/membership.controller';

const router = Router();

// Permetti all'utente autenticato di unirsi al gruppo
router.post('/:id/join', joinGroup);

// Permetti al proprietario del gruppo di aggiungere un membro (se sono amici)
router.post('/:id/add', ownerAddMember);

export default router;
