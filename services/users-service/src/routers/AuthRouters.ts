import { Router } from 'express';
import { registerUser, loginUser, getUser, updateUser, deleteUser } from '../controllers/users.controller';

const router = Router();

// Rotta per la registrazione di un nuovo utente
router.post('/register', registerUser);

// Rotta per il login
router.post('/login', loginUser);

router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;