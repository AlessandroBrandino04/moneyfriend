export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED';

export interface IFriendship {
  id: string;
  user1Id: string;
  user2Id: string;
  status: FriendshipStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  isDeleted: boolean;
}

export default IFriendship;
