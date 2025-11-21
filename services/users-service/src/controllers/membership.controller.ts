import { Request, Response } from 'express';
import MembershipService from '../services/membership.service';

const service = new MembershipService();

export const joinGroup = async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const groupId = req.params.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Missing user id' });

  try {
    const membership = await service.addMember(userId, groupId);
    res.status(201).json({ success: true, data: membership });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
};

export default { joinGroup };
