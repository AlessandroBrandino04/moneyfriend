import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';
import { UsersService } from '../src/services/users.service';
import FriendshipService from '../src/services/friendship.service';

const prisma = new PrismaClient();
const usersService = new UsersService();
const friendshipService = new FriendshipService();

describe('Friendship Service API', () => {
  // Test users created for friendship flow
  let userA: { id?: string; email?: string; password?: string; nickname?: string } = {};
  let userB: { id?: string; email?: string; password?: string; nickname?: string } = {};

  beforeAll(async () => {
    // Connect to DB
    await prisma.$connect();

    // TODO: create or prepare test users here. Example (optional):
    const hashed = await (usersService as any).hashPassword('Password123!');
    const a = await prisma.user.create({ data: { email: 'a@example.com', passwordHash: hashed, nickname: 'alice', name: 'Alice', surname: 'A' } });
    const b = await prisma.user.create({ data: { email: 'b@example.com', passwordHash: hashed, nickname: 'bob', name: 'Bob', surname: 'B' } });
    userA = { id: a.id, email: a.email, password: 'Password123!', nickname: a.nickname };
    userB = { id: b.id, email: b.email, password: 'Password123!', nickname: b.nickname };
  });

  afterAll(async () => {
    // Remove friendships referring to these users first to avoid FK constraint errors
    /*try {
      if (userA.id) {
        await prisma.friendship.deleteMany({ where: { OR: [{ user1Id: userA.id }, { user2Id: userA.id }] } });
      }
      if (userB.id) {
        await prisma.friendship.deleteMany({ where: { OR: [{ user1Id: userB.id }, { user2Id: userB.id }] } });
      }
    } catch (e) {
      console.debug('Error cleaning friendships in afterAll:', e);
    }*/

    if (userA.email) await prisma.user.deleteMany({ where: { email: userA.email } });
    if (userB.email) await prisma.user.deleteMany({ where: { email: userB.email } });
    await prisma.$disconnect();
  });

  describe('Test friendship request flow', () => {
    it('should send a friend request from User A to User B', async () => {
      const response = await request(app)
        .post('/api/users/friend-request')
        .set('x-user-id', userA.id || '') // Simulate User A as requester
        .send({ nickname: userB.nickname });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('PENDING');
    });

    it('should return 200 OK and the existing request if duplicated', async () => {
      const response = await request(app)
        .post('/api/users/friend-request')
        .set('x-user-id', userA.id || '') // Simulate User A as requester
        .send({ nickname: userB.nickname });
        expect(response.status).toBe(201);
    });

    it('Post /friend-request/:id/accept', async () => {

        //Lista delle richieste in ingresso per B
        const incomingRequests = await request(app)
          .get('/api/users/friend-requests?status=PENDING')
          .set('x-user-id', userB.id || '');

        // Check response and data presence
        expect(incomingRequests.status).toBe(200);
        const incomingData = incomingRequests.body && Array.isArray(incomingRequests.body.data) ? incomingRequests.body.data : [];
        if (incomingData.length === 0) {
          throw new Error('No incoming friend requests found for User B');
        }

        const requestId = incomingData[0].id;
        const response = await request(app)
          .post(`/api/users/friend-request/${requestId}/accept`)
          .set('x-user-id', userB.id || '');

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('ACCEPTED');
    });
  });

});
