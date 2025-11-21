import { Router } from 'express';
import { createGroup, getGroup } from '../controllers/group.controller';

const router = Router();

// Crea un gruppo (richiede autenticazione)
router.post('/', createGroup);

// Ottieni gruppo e membri (solo se sei membro)
router.get('/:id', getGroup);

export default router;
