import { UserRepository } from '../repositories/user.repository';
import FriendshipRepository from '../repositories/friendship.repository';
import { FriendshipStatus } from '../models/Friendship';

export class FriendshipService {
  private userRepo: UserRepository;
  private frRepo: FriendshipRepository;

  constructor(userRepo?: UserRepository, frRepo?: FriendshipRepository) {
    this.userRepo = userRepo ?? new UserRepository();
    this.frRepo = frRepo ?? new FriendshipRepository();
  }

  /**
   * Send a friend request: senderId is the requester (from header), targetNickname is used to find the user.
   */
  async sendRequest(senderId: string, targetNickname: string) {
    const target = await this.userRepo.findByNickname(targetNickname);
    if (!target) throw new Error('User with that nickname not found');
    if (target.id === senderId) throw new Error('Cannot friend yourself');

    const existing = await this.frRepo.findBetween(senderId, target.id);
    if (existing) {
      return existing; // already exists (could check status)
    }

    const created = await this.frRepo.create({ user1Id: senderId, user2Id: target.id, status: 'PENDING' as any });
    return created;
  }

  async acceptRequest(requestId: string, accepterId: string) {
    const fr = await this.frRepo.findById(requestId);
    if (!fr) throw new Error('Friend request not found');
    if (fr.user2Id !== accepterId) throw new Error('Not authorized to accept this request');
    return this.frRepo.updateStatus(requestId, 'ACCEPTED' as any);
  }

  async listFriends(userId: string) {
    const list = await this.frRepo.listForUser(userId);
    const friends = [] as any[];
    for (const f of list) {
      if (f.status !== 'ACCEPTED') continue;
      const otherId = f.user1Id === userId ? f.user2Id : f.user1Id;
      const user = await this.userRepo.findById(otherId);
      if (user) friends.push({ id: user.id, email: user.email, nickname: user.nickname, name: user.name, surname: user.surname });
    }
    return friends;
  }

  /**
   * List friendship records for a user filtered by status (PENDING | ACCEPTED | BLOCKED)
   * Returns entries with direction (incoming/outgoing) and the other user's basic info.
   */
  async listByStatus(userId: string, status: FriendshipStatus) {
    const list = await this.frRepo.listForUser(userId);
    console.log('Friendships found for user:', list);
    const out: any[] = [];
    for (const f of list) {
      if (f.status !== status) continue;
      const direction = f.user1Id === userId ? 'outgoing' : 'incoming';
      const otherId = f.user1Id === userId ? f.user2Id : f.user1Id;
      const user = await this.userRepo.findById(otherId);
      if (!user) continue;
      const info: any = { id: f.id, status: f.status, direction, user: { id: user.id, nickname: (user as any).nickname } };
      // For accepted friendships, include more details
      if (f.status === 'ACCEPTED') {
        info.user.email = (user as any).email;
        info.user.name = (user as any).name;
        info.user.surname = (user as any).surname;
      }
      out.push(info);
    }
    return out;
  }
}

export default FriendshipService;
