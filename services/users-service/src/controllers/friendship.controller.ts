import { Request, Response } from 'express';
import FriendshipService from '../services/friendship.service';

const service = new FriendshipService();

export const sendFriendRequest = async (req: Request, res: Response) => {
  const senderId = req.headers['x-user-id'] as string;
  const { nickname } = req.body;
  if (!senderId) return res.status(401).json({ success: false, error: 'Missing user id' });
  if (!nickname) return res.status(400).json({ success: false, error: 'Missing target nickname' });

  try {
    const result = await service.sendRequest(senderId, nickname);
    res.status(201).json({ success: true, data: result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
  const accepterId = req.headers['x-user-id'] as string;
  const requestId = req.params.id;
  if (!accepterId) return res.status(401).json({ success: false, error: 'Missing user id' });

  try {
    const result = await service.acceptRequest(requestId, accepterId);
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
};

export const listFriends = async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ success: false, error: 'Missing user id' });
  try {
    const list = await service.listFriends(userId);
    res.json({ success: true, data: list });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const listRequests = async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ success: false, error: 'Missing user id' });

  const status = (req.query.status as string || 'PENDING').toUpperCase();
  if (!['PENDING', 'ACCEPTED', 'BLOCKED'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  try {
    const list = await service.listByStatus(userId, status as any);
    res.json({ success: true, data: list });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export default {
  sendFriendRequest,
  acceptFriendRequest,
  listFriends,
  listRequests,
};
