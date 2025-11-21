export interface IMembership {
  id: string;
  userId: string;
  groupId: string;
  isDeleted: boolean;
  role: string;
}

export default IMembership;
