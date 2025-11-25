import { PrismaClient } from '@prisma/client';

export class MembershipRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? new PrismaClient();
  }

  async create(data: { userId: string; groupId: string; role?: string }) {
    // Use upsert to avoid duplicate unique constraint errors and to reactivate soft-deleted memberships
    return this.prisma.membership.upsert({
      where: { userId_groupId: { userId: data.userId, groupId: data.groupId } } as any,
      update: { isDeleted: false, role: data.role } as any,
      create: data as any,
    });
  }

  async findById(id: string) {
    return this.prisma.membership.findUnique({ where: { id } });
  }

  async findByUserAndGroup(userId: string, groupId: string) {
    return this.prisma.membership.findUnique({ where: { userId_groupId: { userId, groupId } } as any });
  }

  async listMembersOfGroup(groupId: string) {
    return this.prisma.membership.findMany({ where: { groupId, isDeleted: false } as any });
  }

  async listMembershipsForUser(userId: string) {
    return this.prisma.membership.findMany({ where: { userId, isDeleted: false } as any });
  }

  async softDelete(id: string) {
    return this.prisma.membership.update({ where: { id }, data: { isDeleted: true } as any });
  }
}

export default MembershipRepository;
