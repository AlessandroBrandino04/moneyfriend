import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';
import { UsersService } from '../src/services/users.service';

const prisma = new PrismaClient();
const usersService = new UsersService();

describe('Group Service API', () => {
  let creator: any = {};
  let member: any = {};
  let outsider: any = {};
  let createdGroupId: string | undefined;

  beforeAll(async () => {
    await prisma.$connect();
    const hashed = await (usersService as any).hashPassword('Password123!');
    const a = await prisma.user.create({ data: { email: 'g_creator@example.com', passwordHash: hashed, nickname: 'gcreator', name: 'G', surname: 'Creator' } });
    const b = await prisma.user.create({ data: { email: 'g_member@example.com', passwordHash: hashed, nickname: 'gmember', name: 'G', surname: 'Member' } });
    const c = await prisma.user.create({ data: { email: 'g_outsider@example.com', passwordHash: hashed, nickname: 'goutsider', name: 'G', surname: 'Outsider' } });
    creator = { id: a.id, email: a.email, nickname: a.nickname };
    member = { id: b.id, email: b.email, nickname: b.nickname };
    outsider = { id: c.id, email: c.email, nickname: c.nickname };
  });

  const clearGroupData = async () => {
    try {
      if (createdGroupId) {
        await prisma.membership.deleteMany({ where: { groupId: createdGroupId } });
        await prisma.group.updateMany({ where: { id: createdGroupId }, data: { isDeleted: true } });
      }
    } catch (e) {
      console.debug('cleanup error', e);
    }
  };

  afterEach(async () => {
    await clearGroupData();
    createdGroupId = undefined;
  });

  afterAll(async () => {
    // remove users
    try {
      await prisma.membership.deleteMany({ where: { OR: [{ userId: creator.id }, { userId: member.id }, { userId: outsider.id }] } });
    } catch (e) {
      // ignore
    }
    if (creator.email) await prisma.user.deleteMany({ where: { email: creator.email } });
    if (member.email) await prisma.user.deleteMany({ where: { email: member.email } });
    if (outsider.email) await prisma.user.deleteMany({ where: { email: outsider.email } });
    await prisma.$disconnect();
  });

  it('should create a group and return 201', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('x-user-id', creator.id)
      .send({ name: 'Test Group', description: 'A group for tests' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    createdGroupId = res.body.data.id;
  });

  it('should allow another user to join the group', async () => {
    // First create group
    const createRes = await request(app)
      .post('/api/groups')
      .set('x-user-id', creator.id)
      .send({ name: 'Joinable Group' });
    expect(createRes.status).toBe(201);
    const groupId = createRes.body.data.id;
    createdGroupId = groupId;

    // Member joins
    const joinRes = await request(app)
      .post(`/api/groups/${groupId}/join`)
      .set('x-user-id', member.id)
      .send();
    expect(joinRes.status).toBe(201);
    expect(joinRes.body.success).toBe(true);

    // Fetch group as member
    const getRes = await request(app)
      .get(`/api/groups/${groupId}`)
      .set('x-user-id', member.id);
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data).toHaveProperty('group');
    expect(Array.isArray(getRes.body.data.members)).toBe(true);
    const memberIds = getRes.body.data.members.map((m: any) => m.userId);
    expect(memberIds).toContain(member.id);
    expect(memberIds).toContain(creator.id);
  });

  it('should forbid access to group details for non-members', async () => {
    // create group
    const createRes = await request(app)
      .post('/api/groups')
      .set('x-user-id', creator.id)
      .send({ name: 'Private Group' });
    expect(createRes.status).toBe(201);
    const groupId = createRes.body.data.id;
    createdGroupId = groupId;

    // outsider tries to access
    const res = await request(app)
      .get(`/api/groups/${groupId}`)
      .set('x-user-id', outsider.id);
    expect(res.status).toBe(403);
  });

  it('should destroy group on creator elimination', async () => {
    // create group
    const createRes = await request(app)
      .post('/api/groups')
      .set('x-user-id', creator.id)
      .send({ name: 'To Be Deleted Group' });
    expect(createRes.status).toBe(201);
    const groupId = createRes.body.data.id;
    createdGroupId = groupId;

    // delete creator
    await prisma.user.delete({ where: { id: creator.id } });
    // try to access group
    const res = await request(app)
      .get(`/api/groups/${groupId}`)
      .set('x-user-id', member.id);
    expect(res.status).toBe(403);
    createdGroupId = undefined; 
    });

    

});
