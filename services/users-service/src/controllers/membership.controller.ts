import { Request, Response } from 'express';
import MembershipService from '../services/membership.service';
import GroupRepository from '../repositories/group.repository';
import { FriendshipRepository } from '../repositories/friendship.repository';
import { sendNotification } from '../notifications/sendNotification';
import { publishUserEvent } from '../notifications/publishUserEvent';

const service = new MembershipService();

export const joinGroup = async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const groupId = req.params.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Missing user id' });

  try {
    const membership = await service.addMember(userId, groupId);
    sendNotification('GROUP_JOIN', { groupId, userId, membershipId: membership.id });
    (async () => {
      try {
        await publishUserEvent('membership.created', { id: membership.id, userId, groupId, role: membership.role });
      } catch (e) { console.debug('publishUserEvent membership.created failed', e); }
    })();
    res.status(201).json({ success: true, data: membership });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
};

export const ownerAddMember = async (req: Request, res: Response) => {
  const ownerId = req.headers['x-user-id'] as string;
  const groupId = req.params.id;
  const { userId: targetUserId, role } = req.body as { userId?: string; role?: string };
  if (!ownerId) return res.status(401).json({ success: false, error: 'Missing user id' });
  if (!targetUserId) return res.status(400).json({ success: false, error: 'Missing target user id' });

  try {
    const gRepo = new GroupRepository();
    const group = await gRepo.findById(groupId);
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
    if (group.creatorId !== ownerId) return res.status(403).json({ success: false, error: 'Only group owner can add members' });

    // verify friendship between owner and the target user
    const frRepo = new FriendshipRepository();
    const friendship = await frRepo.findBetween(ownerId, targetUserId);
    if (!friendship || (friendship.status !== 'ACCEPTED' && (friendship as any).status !== 'ACCEPTED')) {
      return res.status(403).json({ success: false, error: 'Owner and target user must be friends' });
    }

    const membership = await service.addMember(targetUserId, groupId, role ?? 'member');
    sendNotification('GROUP_MEMBER_ADDED', { groupId, userId: targetUserId, by: ownerId, membershipId: membership.id });
    (async () => {
      try {
        await publishUserEvent('membership.created', { id: membership.id, userId: targetUserId, groupId, role: membership.role });
      } catch (e) { console.debug('publishUserEvent membership.created failed', e); }
    })();

    res.status(201).json({ success: true, data: membership });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
};

export default { joinGroup };
