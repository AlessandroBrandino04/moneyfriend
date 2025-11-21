import { Request, Response } from 'express';
import GroupService from '../services/group.service';

const service = new GroupService();

export const createGroup = async (req: Request, res: Response) => {
  const creatorId = req.headers['x-user-id'] as string;
  if (!creatorId) return res.status(401).json({ success: false, error: 'Missing user id' });
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Missing group name' });

  try {
    const group = await service.createGroup(creatorId, { name, description });
    res.status(201).json({ success: true, data: group });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
};

export const getGroup = async (req: Request, res: Response) => {
  const requesterId = req.headers['x-user-id'] as string;
  const groupId = req.params.id;
  if (!requesterId) return res.status(401).json({ success: false, error: 'Missing user id' });

  try {
    const result = await service.getGroupIfMember(requesterId, groupId);
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(403).json({ success: false, error: e.message });
  }
};

export default { createGroup, getGroup };
