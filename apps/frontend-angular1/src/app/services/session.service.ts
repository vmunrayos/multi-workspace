import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
import type {
	LoginResponse,
	MessageResponse,
	SessionUser,
} from "../models/session.model";

@Injectable({
	providedIn: "root",
})
export class SessionService {
	private readonly http = inject(HttpClient);
	private currentUser: SessionUser | null = null;

	readonly baseUrl = environment.apiBaseUrl;

	get snapshot(): SessionUser | null {
		return this.currentUser;
	}

	async refreshSession(): Promise<SessionUser | null> {
		try {
			const user = await firstValueFrom(
				this.http.get<SessionUser>(`${this.baseUrl}/api/session/me`, {
					withCredentials: true,
				}),
			);

			this.currentUser = user;
			return user;
		} catch (error) {
			if (error instanceof HttpErrorResponse && error.status === 401) {
				this.currentUser = null;
				return null;
			}

			throw error;
		}
	}

	async loginWithOtp(phoneNumber: string, otp: string): Promise<LoginResponse> {
		const response = await firstValueFrom(
			this.http.post<LoginResponse>(
				`${this.baseUrl}/api/authentication/login/otp`,
				{ phoneNumber, otp },
				{
					withCredentials: true,
				},
			),
		);

		this.currentUser = response.user;
		return response;
	}

	async logout(): Promise<MessageResponse> {
		const response = await firstValueFrom(
			this.http.post<MessageResponse>(
				`${this.baseUrl}/api/authentication/logout`,
				{},
				{
					withCredentials: true,
				},
			),
		);

		this.currentUser = null;
		return response;
	}
}
