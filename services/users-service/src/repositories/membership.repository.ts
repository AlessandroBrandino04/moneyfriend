import { PrismaClient } from '@prisma/client';

export class MembershipRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? new PrismaClient();
  }

  async create(data: { userId: string; groupId: string; role?: string }) {
    return this.prisma.membership.create({ data });
  }

  async findById(id: string) {
    return this.prisma.membership.findUnique({ where: { id } });
  }

  async findByUserAndGroup(userId: string, groupId: string) {
    return this.prisma.membership.findUnique({ where: { userId_groupId: { userId, groupId } } as any });
  }

  async listMembersOfGroup(groupId: string) {
    return this.prisma.membership.findMany({ where: { groupId, isDeleted: false } });
  }

  async listMembershipsForUser(userId: string) {
    return this.prisma.membership.findMany({ where: { userId, isDeleted: false } });
  }

  async softDelete(id: string) {
    return this.prisma.membership.update({ where: { id }, data: { isDeleted: true } });
  }
}

export default MembershipRepository;
