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

