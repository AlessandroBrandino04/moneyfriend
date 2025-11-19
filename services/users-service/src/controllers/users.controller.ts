import { Router, Request, Response } from 'express';
import { UsersService } from '../services/users.service';

const router = Router();
const service = new UsersService();



export const registerUser = async (req: Request, res: Response) => {
    try {
      const { email, name, surname, password } = req.body;
    const result = await service.register({ email, name, surname, password });
    // result has shape { user, token }
    res.status(201).json({ success: true, data: { user: result.user, token: result.token } });
    } catch (err: any) {
        res.status(400).json({ success: false, error: err.message });
    }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await service.login(email, password);
  if (!result) return res.status(401).json({ success: false, error: 'Invalid credentials' });
  return res.json({ success: true, data: { user: result.user, token: result.token } });
};

export const getUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = await service.getUser(id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ success: true, data: user });
};

export const updateUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const data = req.body;
  try {
    const updated = await service.updateUser(id, data);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  await service.deleteUser(id);
  res.json({ success: true });
};
