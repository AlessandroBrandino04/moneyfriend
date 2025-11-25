import { Request, Response } from 'express';
import FriendshipService from '../services/friendship.service';
import { sendNotification } from '../notifications/sendNotification';
import { publishUserEvent } from '../notifications/publishUserEvent';

const service = new FriendshipService();

export const sendFriendRequest = async (req: Request, res: Response) => {
  const senderId = req.headers['x-user-id'] as string;
  const { nickname } = req.body;
  if (!senderId) return res.status(401).json({ success: false, error: 'Missing user id' });
  if (!nickname) return res.status(400).json({ success: false, error: 'Missing target nickname' });

  try {
    const result = await service.sendRequest(senderId, nickname);
    // fire-and-forget notification
    sendNotification('FRIEND_REQUEST', { friendshipId: result.id, from: result.user1Id, to: result.user2Id, status: result.status });
    (async () => {
      try {
        await publishUserEvent('friendship.created', { id: result.id, user1Id: result.user1Id, user2Id: result.user2Id, status: result.status });
      } catch (e) { console.debug('publishUserEvent friendship.created failed', e); }
    })();
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
    sendNotification('FRIEND_ACCEPTED', { friendshipId: result.id, by: accepterId, status: result.status, user1: result.user1Id, user2: result.user2Id });
    (async () => {
      try {
        await publishUserEvent('friendship.accepted', { id: result.id, user1Id: result.user1Id, user2Id: result.user2Id, status: result.status });
      } catch (e) { console.debug('publishUserEvent friendship.accepted failed', e); }
    })();
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

export const getFriendDetail = async (req: Request, res: Response) => {
  const requesterId = req.headers['x-user-id'] as string;
  const friendId = req.params.id;
  if (!requesterId) return res.status(401).json({ success: false, error: 'Missing user id' });
  if (!friendId) return res.status(400).json({ success: false, error: 'Missing friend id' });

  try {
    const detail = await service.getFriendDetail(requesterId, friendId);
    res.json({ success: true, data: detail });
  } catch (e: any) {
    if (e.message === 'Not friends') return res.status(403).json({ success: false, error: 'Forbidden' });
    if (e.message === 'User not found') return res.status(404).json({ success: false, error: 'User not found' });
    res.status(400).json({ success: false, error: e.message });
  }
};

export const deleteFriend = async (req: Request, res: Response) => {
  const requesterId = req.headers['x-user-id'] as string;
  const friendId = req.params.id;
  if (!requesterId) return res.status(401).json({ success: false, error: 'Missing user id' });
  if (!friendId) return res.status(400).json({ success: false, error: 'Missing friend id' });

  try {
    const removed = await service.removeFriend(requesterId, friendId);
    // notify
    sendNotification('FRIEND_REMOVED', { friendshipId: removed.id, by: requesterId, user1: removed.user1Id, user2: removed.user2Id });
    (async () => {
      try {
        await publishUserEvent('friendship.removed', { id: removed.id, user1Id: removed.user1Id, user2Id: removed.user2Id });
      } catch (e) { console.debug('publishUserEvent friendship.removed failed', e); }
    })();
    res.json({ success: true, data: removed });
  } catch (e: any) {
    if (e.message === 'Friendship not found') return res.status(404).json({ success: false, error: 'Friendship not found' });
    if (e.message === 'Not authorized') return res.status(403).json({ success: false, error: 'Forbidden' });
    res.status(400).json({ success: false, error: e.message });
  }
};

export default {
  sendFriendRequest,
  acceptFriendRequest,
  listFriends,
  listRequests,
  getFriendDetail,
  deleteFriend,
};
