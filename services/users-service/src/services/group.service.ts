import GroupRepository from '../repositories/group.repository';
import MembershipService from './membership.service';

export class GroupService {
  private gRepo: GroupRepository;
  private membershipService: MembershipService;

  constructor(gRepo?: GroupRepository, membershipService?: MembershipService) {
    this.gRepo = gRepo ?? new GroupRepository();
    this.membershipService = membershipService ?? new MembershipService();
  }

  async createGroup(creatorId: string, data: { name: string; description?: string }) {
    const group = await this.gRepo.create({ name: data.name, description: data.description, creatorId });
    // add creator as owner
    await this.membershipService.addMember(creatorId, group.id, 'owner');
    return group;
  }

  async getGroupIfMember(userId: string, groupId: string) {
    const isMember = await this.membershipService.isMember(userId, groupId);
    if (!isMember) throw new Error('Not a member of this group');
    const group = await this.gRepo.findById(groupId);
    const members = await this.membershipService.listMembers(groupId);
    return { group, members };
  }
}

export default GroupService;
