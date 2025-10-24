import { CommonModule } from "@angular/common";
import {
	Component,
	type OnInit,
	type Signal,
	computed,
	inject,
	signal,
} from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { environment } from "../environments/environment";
import type { SessionUser } from "./models/session.model";
import { SessionService } from "./services/session.service";

type StatusMessage = {
	type: "success" | "error";
	message: string;
} | null;

@Component({
	selector: "app-root",
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: "./app.html",
	styleUrl: "./app.css",
})
export class App implements OnInit {
	private readonly sessionService = inject(SessionService);
	private readonly route = inject(ActivatedRoute);

	private readonly statusState = signal<StatusMessage>(null);
	private readonly loadingState = signal(false);
	private readonly checkingState = signal(true);
	private readonly sessionState = signal<SessionUser | null>(null);
	private readonly fromAdminState = signal(false);
	private readonly adminNameState = signal<string>("");

	readonly alertStatus = computed(() => this.statusState());
	readonly loading = this.loadingState.asReadonly();
	readonly checking = this.checkingState.asReadonly();
	readonly session: Signal<SessionUser | null> = this.sessionState.asReadonly();
	readonly fromAdmin = this.fromAdminState.asReadonly();
	readonly adminName = this.adminNameState.asReadonly();

	readonly hubUrl = environment.hubUrl;
	readonly adminUrl = environment.adminAppUrl;

	async ngOnInit(): Promise<void> {
		const query = this.route.snapshot.queryParamMap;
		if (query.get("from") === "admin") {
			this.fromAdminState.set(true);
			const adminParam = query.get("admin");
			if (adminParam) {
				this.adminNameState.set(adminParam);
			}
		}
		await this.refreshSession(false);
	}

	async refreshSession(showSpinner = true): Promise<void> {
		if (showSpinner) {
			this.checkingState.set(true);
		}

		try {
			const user = await this.sessionService.refreshSession();
			this.sessionState.set(user);
			if (user?.role === "admin" && !this.adminNameState()) {
				this.adminNameState.set(user.name);
			}
		} catch (error) {
			console.error("Failed to refresh session", error);
			this.setStatus({
				type: "error",
				message:
					"Unable to reach the session endpoint. Ensure the backend is running.",
			});
		} finally {
			this.checkingState.set(false);
		}
	}

	async logout(): Promise<void> {
		if (this.loading()) {
			return;
		}

		this.loadingState.set(true);
		this.setStatus(null);

		try {
			const response = await this.sessionService.logout();
			this.sessionState.set(null);
			this.setStatus({ type: "success", message: response.message });
		} catch (error) {
			console.error("Failed to logout", error);
			this.setStatus({
				type: "error",
				message: "Could not clear the session cookie. Try again.",
			});
		} finally {
			this.loadingState.set(false);
		}
	}

	goToAdminDashboard(): void {
		window.location.href = this.adminUrl;
	}

	clearStatus(): void {
		this.setStatus(null);
	}

	private setStatus(message: StatusMessage): void {
		this.statusState.set(message);
		if (message) {
			setTimeout(() => {
				if (this.statusState() === message) {
					this.statusState.set(null);
				}
			}, 5000);
		}
	}
}
