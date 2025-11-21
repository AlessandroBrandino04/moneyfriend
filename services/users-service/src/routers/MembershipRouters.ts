import { Router } from 'express';
import { joinGroup } from '../controllers/membership.controller';

const router = Router();

// Permetti all'utente autenticato di unirsi al gruppo
router.post('/:id/join', joinGroup);

export default router;
