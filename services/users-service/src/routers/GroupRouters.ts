import { Router } from 'express';
import { createGroup, getGroup , listGroups} from '../controllers/group.controller';

const router = Router();

// Crea un gruppo (richiede autenticazione)
router.post('/', createGroup);

// Lista i gruppi dell'utente autenticato
router.get('/', listGroups);

// Ottieni gruppo e membri (solo se sei membro)
router.get('/:id', getGroup);

export default router;
