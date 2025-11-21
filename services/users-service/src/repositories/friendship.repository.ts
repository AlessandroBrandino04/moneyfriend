import { PrismaClient, Friendship, FriendshipStatus } from '@prisma/client';

export class FriendshipRepository {
  constructor(private prisma: PrismaClient = new PrismaClient()) {}

  async create(data: {
    user1Id: string;
    user2Id: string;
    status?: FriendshipStatus;
  }): Promise<Friendship> {
    return this.prisma.friendship.create({ data });
  }

  async findById(id: string): Promise<Friendship | null> {
    return this.prisma.friendship.findUnique({ where: { id } });
  }

  async findBetween(user1Id: string, user2Id: string): Promise<Friendship | null> {
    return this.prisma.friendship.findFirst({ where: { OR: [{ user1Id, user2Id }, { user1Id: user2Id, user2Id: user1Id }] } });
  }

  async updateStatus(id: string, status: FriendshipStatus): Promise<Friendship> {
    return this.prisma.friendship.update({ where: { id }, data: { status } });
  }

  async listForUser(userId: string): Promise<Friendship[]> {
    return this.prisma.friendship.findMany({ where: { OR: [{ user1Id: userId }, { user2Id: userId }], isDeleted: false } });
  }

  async softDelete(id: string): Promise<Friendship> {
    return this.prisma.friendship.update({ where: { id }, data: { isDeleted: true } });
  }
}

export default FriendshipRepository;
