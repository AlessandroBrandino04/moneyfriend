import { Router } from 'express';
import { registerUser, loginUser, getUser, updateUser, deleteUser, getNickname, getMe } from '../controllers/users.controller';

const router = Router();

// Rotta per la registrazione di un nuovo utente
router.post('/register', registerUser);

// Rotta per il login
router.post('/login', loginUser);

// Public nickname route (specific, placed before generic `/:id` to avoid shadowing)
router.get('/nickname/:id', getNickname);
// Place the /me route before the generic '/:id' so it is not shadowed
router.get('/me', getMe);
router.put('/me', updateUser);
router.delete('/me', deleteUser);
router.get('/:id', getUser);

export default router;