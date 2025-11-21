export interface IGroup {
  id: string;
  name: string;
  description?: string | null;
  creatorId: string;
  createdAt: string | Date;
  isDeleted: boolean;
}

export default IGroup;
