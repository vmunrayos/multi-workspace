import { CommonModule } from "@angular/common";
import {
	Component,
	type OnInit,
	type Signal,
	inject,
	signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { environment } from "../environments/environment";
import type { SessionUser, UserApplication } from "./models/session.model";
import { AdminSessionService } from "./services/admin-session.service";

type StatusMessage = {
	type: "success" | "error";
	message: string;
} | null;

@Component({
	selector: "app-root",
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: "./app.html",
	styleUrl: "./app.css",
})
export class App implements OnInit {
	private readonly fb = inject(FormBuilder);
	private readonly sessionService = inject(AdminSessionService);

	readonly form = this.fb.nonNullable.group({
		email: ["admin@example.com", [Validators.required, Validators.email]],
		password: ["SuperSecure123!", [Validators.required]],
	});

	private readonly statusState = signal<StatusMessage>(null);
	private readonly loadingState = signal(false);
	private readonly checkingState = signal(true);
	readonly session: Signal<SessionUser | null> = this.sessionService.session;
	readonly status = this.statusState.asReadonly();
	readonly loading = this.loadingState.asReadonly();
	readonly checking = this.checkingState.asReadonly();
	readonly applications = this.sessionService.getApplications();

	readonly userAppUrl = environment.userAppUrl;
	readonly hubUrl = environment.hubUrl;

	async ngOnInit(): Promise<void> {
		await this.refreshSession(false);
	}

	async submit(): Promise<void> {
		if (this.form.invalid || this.loading()) {
			return;
		}

		this.loadingState.set(true);
		this.setStatus(null);

		const { email, password } = this.form.getRawValue();

		try {
			const response = await this.sessionService.login(email, password);
			this.setStatus({ type: "success", message: response.message });
		} catch (error) {
			console.error("Admin login failed", error);
			this.setStatus({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "Unable to authenticate. Verify the backend is running.",
			});
		} finally {
			this.loadingState.set(false);
		}
	}

	async refreshSession(showSpinner = true): Promise<void> {
		if (showSpinner) {
			this.checkingState.set(true);
		}

		try {
			await this.sessionService.refreshSession();
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
			this.setStatus({ type: "success", message: response.message });
		} catch (error) {
			console.error("Failed to logout", error);
			this.setStatus({
				type: "error",
				message: "Could not clear the admin session. Try again.",
			});
		} finally {
			this.loadingState.set(false);
		}
	}

	openApplication(app: UserApplication): void {
		const adminName = this.session()?.name ?? "";
		const url = new URL(this.userAppUrl);
		url.searchParams.set("appId", app.id);
		url.searchParams.set("admin", adminName);
		url.searchParams.set("from", "admin");
		window.location.href = url.toString();
	}

	resetDemoValues(): void {
		this.form.reset(
			{
				email: "admin@example.com",
				password: "SuperSecure123!",
			},
			{ emitEvent: false },
		);
	}

	clearStatus(): void {
		this.statusState.set(null);
	}

	private setStatus(next: StatusMessage): void {
		this.statusState.set(next);
		if (next) {
			setTimeout(() => {
				if (this.statusState() === next) {
					this.statusState.set(null);
				}
			}, 5000);
		}
	}
}
