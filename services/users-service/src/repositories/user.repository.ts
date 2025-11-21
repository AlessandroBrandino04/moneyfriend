import { PrismaClient, Prisma } from '@prisma/client';
import { User } from '../models/User';

// NOTE: Some Prisma setups/version combinations don't export a top-level `User` type.
// To avoid build-time type errors across environments we keep the repository signatures
// tolerant (`any`) and map to nicer types at the service/controller boundary.

export class UserRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? new PrismaClient();
  }

  async createUser(data: any): Promise<any> {
    // Ensure required Prisma fields are present. If `nickname` is missing,
    // default it to the local-part of the email (before the @).
    const nickname = data.nickname ?? (data.email ? String(data.email).split('@')[0] : undefined);
    const createData: any = {
      email: data.email,
      nickname: nickname as string,
      name: data.name ?? '',
      surname: data.surname ?? '',
      passwordHash: data.passwordHash,
    };

    return this.prisma.user.create({ data: createData });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateUser(id: string, data: Partial<any>): Promise<any> {
    return this.prisma.user.update({ where: { id }, data: data as any });
  }

  async deleteUser(id: string): Promise<any> {
    return this.prisma.user.delete({ where: { id } });
  }

  async findByNickname(nickname: string): Promise<any | null> {
    return this.prisma.user.findUnique({ where: { nickname } });
  }
}

export default UserRepository;
