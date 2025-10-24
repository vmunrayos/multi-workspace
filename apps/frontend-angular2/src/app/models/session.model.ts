export type SessionRole = "user" | "admin";

export interface SessionUser {
	id: string;
	name: string;
	role: SessionRole;
	phoneNumber?: string | null;
	email?: string | null;
}

export interface AdminLoginRequest {
	email: string;
	password: string;
}

export interface AdminLoginResponse {
	user: SessionUser;
	message: string;
}

export interface MessageResponse {
	message: string;
}

export interface UserApplication {
	id: string;
	applicantName: string;
	product: string;
	stage: string;
	lastUpdated: string;
}
