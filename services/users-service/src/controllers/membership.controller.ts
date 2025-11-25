import { Request, Response } from 'express';
import MembershipService from '../services/membership.service';
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

export default { joinGroup };
