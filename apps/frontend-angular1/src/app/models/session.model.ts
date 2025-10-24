export type SessionRole = "user" | "admin";

export interface SessionUser {
	id: string;
	name: string;
	role: SessionRole;
	phoneNumber?: string | null;
	email?: string | null;
}

export interface LoginResponse {
	user: SessionUser;
	message: string;
}

export interface MessageResponse {
	message: string;
}
