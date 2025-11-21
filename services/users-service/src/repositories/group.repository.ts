import { PrismaClient, Group } from '@prisma/client';

export class GroupRepository {
  constructor(private prisma: PrismaClient = new PrismaClient()) {}

  async create(data: { name: string; description?: string; creatorId: string }): Promise<Group> {
    return this.prisma.group.create({ data });
  }

  async findById(id: string): Promise<Group | null> {
    return this.prisma.group.findUnique({ where: { id } });
  }

  async listForUser(userId: string): Promise<Group[]> {
    return this.prisma.group.findMany({ where: { memberships: { some: { userId } }, isDeleted: false } as any });
  }

  async softDelete(id: string): Promise<Group> {
    return this.prisma.group.update({ where: { id }, data: { isDeleted: true } });
  }
}

export default GroupRepository;
