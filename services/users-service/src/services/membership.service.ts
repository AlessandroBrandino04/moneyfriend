import MembershipRepository from '../repositories/membership.repository';

export class MembershipService {
  private mRepo: MembershipRepository;

  constructor(mRepo?: MembershipRepository) {
    this.mRepo = mRepo ?? new MembershipRepository();
  }

  async addMember(userId: string, groupId: string, role = 'member') {
    return this.mRepo.create({ userId, groupId, role });
  }

  async removeMember(id: string) {
    return this.mRepo.softDelete(id);
  }

  async isMember(userId: string, groupId: string) {
    const m = await this.mRepo.findByUserAndGroup(userId, groupId);
    return !!m && !m.isDeleted;
  }

  async listMembers(groupId: string) {
    return this.mRepo.listMembersOfGroup(groupId);
  }
}

export default MembershipService;
