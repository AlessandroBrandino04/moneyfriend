import { Router, Request, Response } from 'express';
import { UsersService } from '../services/users.service';

const router = Router();
const service = new UsersService();



export const registerUser = async (req: Request, res: Response) => {
  console.log('Register User - Request Body:', req.body);
  console.log('Register User - Headers:', req.headers);
    try {
      const { email, name, surname, password, nickname } = req.body;
    const result = await service.register({ email, name, surname, password, nickname });
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
  const requesterId = req.headers['x-user-id'] as string | undefined;
  const user = await service.getUser(id, requesterId);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ success: true, data: user });
};

export const getNickname = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const nick = await service.getNickname(id);
    if (!nick) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, data: nick });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const id = req.headers['x-user-id'] as string;
  if (!id) {
    return res.status(401).json({ success: false, error: 'Missing user id' });
  }
  console.log('Updating user with ID from header:', req.headers);
  const data = req.body;
  try {
    const updated = await service.updateUser(id, data);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = req.headers['x-user-id'] as string;
  await service.deleteUser(id);
  res.json({ success: true });
};
