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

  let clearFriendships = async () => {
    try {
      if (userA.id) {
        await prisma.friendship.deleteMany({ where: { OR: [{ user1Id: userA.id }, { user2Id: userA.id }] } });
      }
      if (userB.id) {
        await prisma.friendship.deleteMany({ where: { OR: [{ user1Id: userB.id }, { user2Id: userB.id }] } });
      }
    } catch (e) {
      console.debug('Error cleaning friendships in afterAll:', e);
    }
  };

  // Ensure cleanup runs after each test and is awaited
  afterEach(async () => {
    await clearFriendships();
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

  describe('Test friendship normal request flow', () => {
    it('should send a friend request from User A to User B', async () => {
      const response = await request(app)
        .post('/api/users/friend-request')
        .set('x-user-id', userA.id || '') // Simulate User A as requester
        .send({ nickname: userB.nickname });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('PENDING');
    });

    it('should return the existing request if duplicated', async () => {
      const response = await request(app)
        .post('/api/users/friend-request')
        .set('x-user-id', userA.id || '') // Simulate User A as requester
        .send({ nickname: userB.nickname });
      expect(response.status).toBe(201);
    });

    it('Post /friend-request/:id/accept', async () => {

        // Ensure request exists for this test: User A sends a request to User B
        await request(app)
          .post('/api/users/friend-request')
          .set('x-user-id', userA.id || '')
          .send({ nickname: userB.nickname });

        // Lista delle richieste in ingresso per B
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

  describe('Casi particolari', () => {
    it('should auto-accept a pending request if the target user sends a request back', async () => {
      // User A sends request to User B
      const sendResponse = await request(app)
        .post('/api/users/friend-request')
        .set('x-user-id', userA.id || '')
        .send({ nickname: userB.nickname });
      expect(sendResponse.status).toBe(201);
      expect(sendResponse.body.data.status).toBe('PENDING');

      // User B sends request to User A, which should auto-accept
      const autoAcceptResponse = await request(app)
        .post('/api/users/friend-request')
        .set('x-user-id', userB.id || '')
        .send({ nickname: userA.nickname });
      expect(autoAcceptResponse.status).toBe(201);
      expect(autoAcceptResponse.body.data.status).toBe('ACCEPTED');
      // cleanup will run in afterEach
    });
    it('should not allow sending a friend request to oneself', async () => {
      const response = await request(app)
        .post('/api/users/friend-request')
        .set('x-user-id', userA.id || '')
        .send({ nickname: userA.nickname });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot friend yourself');
    });
    it('should not allow to see user details when you are not friends', async () => {
      // User A tries to list friends (should be empty)
      const friendsResponse = await request(app)
        .get('/api/users/friends')
        .set('x-user-id', userA.id || '');
      expect(friendsResponse.status).toBe(200);
      expect(Array.isArray(friendsResponse.body.data)).toBe(true);
      expect(friendsResponse.body.data.length).toBe(0);

      //User A sends requesto to User B data
      const sendResponse = await request(app)
        .get('/api/users/friend-details/' + (userB.id || ''))
        .set('x-user-id', userA.id || '');
      expect(sendResponse.status).toBe(403);
      expect(sendResponse.body.error).toBe('Forbidden');
    });

    it('if the friendship is deleted, users cannot see each other details and can resend another friend request', async () => {
      // User A sends request to User B
      const sendResponse = await request(app)
        .post('/api/users/friend-request')
        .set('x-user-id', userA.id || '')
        .send({ nickname: userB.nickname });
      expect(sendResponse.status).toBe(201);
      expect(sendResponse.body.data.status).toBe('PENDING');
      const requestId = sendResponse.body.data.id;
      // User B accepts
      const acceptResponse = await request(app)
        .post(`/api/users/friend-request/${requestId}/accept`)
        .set('x-user-id', userB.id || '');
      expect(acceptResponse.status).toBe(200);
      expect(acceptResponse.body.data.status).toBe('ACCEPTED');

      // User A deletes the friendship directly
      const deleteRes = await request(app)
        .delete('/api/users/friendship/' + (userB.id || ''))
        .set('x-user-id', userA.id || '');
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });
  });

});
