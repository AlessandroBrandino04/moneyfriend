export interface IUser {
	id: string;
	email: string;
	nickname: string;
	name: string;
	surname: string;
	passwordHash: string;
	createdAt: string | Date;
	isDeleted: boolean;

	// Relations (optional, represented as arrays of related entity ids)
	createdGroups?: string[];
	memberships?: string[];
	initiatedFriendships?: string[];
	receivedFriendships?: string[];
}

// Note: avoid exporting the name `User` to prevent collisions with Prisma-generated types.
/** Internal representation of a user in the system */
export interface User {
	id?: string;
	email: string;
	name?: string | null;
	surname?: string | null;
	passwordHash: string;
	createdAt?: Date;
	memberships?: Array<{ id: string; groupId: string; role?: string }>;
	groups?: Array<{ id: string; name: string }>;
}

/** Public view of a user returned by APIs (no password) */
export interface UserPublic {
	id: string;
	email: string;
	name?: string | null;
	surname?: string | null;
	createdAt: Date;
}

/** Payload for creating a new user */
export interface CreateUserDTO {
	email: string;
	password: string; 
	name?: string;
	surname?: string;
	nickname?: string;
}

/** Payload for updating user fields */
export interface UpdateUserDTO {
	name?: string;
	surname?: string;
}

/** Helper to map internal User -> public DTO */
export function toPublic(user: User): UserPublic {
	return {
		id: user.id!,
		email: user.email,
		name: user.name ?? null,
		surname: user.surname ?? null,
		createdAt: user.createdAt!,
	};
}

