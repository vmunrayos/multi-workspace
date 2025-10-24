import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {
	Injectable,
	type Signal,
	computed,
	inject,
	signal,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
import type {
	AdminLoginResponse,
	MessageResponse,
	SessionUser,
	UserApplication,
} from "../models/session.model";

@Injectable({
	providedIn: "root",
})
export class AdminSessionService {
	private readonly http = inject(HttpClient);
	private readonly userState = signal<SessionUser | null>(null);

	readonly session: Signal<SessionUser | null> = this.userState.asReadonly();
	readonly isAuthenticated = computed(() => this.userState() !== null);

	readonly baseUrl = environment.apiBaseUrl;

	private readonly applications: UserApplication[] = [
		{
			id: "app-001",
			applicantName: "Laura Johnson",
			product: "Personal loan",
			stage: "Documents under review",
			lastUpdated: new Date().toISOString(),
		},
		{
			id: "app-002",
			applicantName: "Peter Martinez",
			product: "SMB credit line",
			stage: "Awaiting signature",
			lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
		},
		{
			id: "app-003",
			applicantName: "Maria Rodriguez",
			product: "Mortgage refinance",
			stage: "Risk analysis",
			lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
		},
	];

	getApplications(): UserApplication[] {
		return this.applications;
	}

	async refreshSession(): Promise<SessionUser | null> {
		try {
			const session = await firstValueFrom(
				this.http.get<SessionUser>(`${this.baseUrl}/api/session/me`, {
					withCredentials: true,
				}),
			);
			this.userState.set(session);
			return session;
		} catch (error) {
			if (error instanceof HttpErrorResponse && error.status === 401) {
				this.userState.set(null);
				return null;
			}
			throw error;
		}
	}

	async login(email: string, password: string): Promise<AdminLoginResponse> {
		const response = await firstValueFrom(
			this.http.post<AdminLoginResponse>(
				`${this.baseUrl}/api/authentication/login/admin`,
				{ email, password },
				{ withCredentials: true },
			),
		);

		this.userState.set(response.user);
		return response;
	}

	async logout(): Promise<MessageResponse> {
		const response = await firstValueFrom(
			this.http.post<MessageResponse>(
				`${this.baseUrl}/api/authentication/logout`,
				{},
				{ withCredentials: true },
			),
		);

		this.userState.set(null);
		return response;
	}
}
