"use client";

import {
	type FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";

type SessionRole = "user" | "admin";

type SessionUser = {
	id: string;
	name: string;
	role: SessionRole;
	phoneNumber?: string | null;
	email?: string | null;
};

type Status = {
	type: "success" | "error";
	message: string;
} | null;

const apiBaseUrl =
	process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://localhost:7100";
const angularUserUrl =
	process.env.NEXT_PUBLIC_USER_APP_URL ?? "http://localhost:4200";
const angularAdminUrl =
	process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "http://localhost:4300";

const otpDefaults = {
	phoneNumber: "5551234567",
	otp: "246810",
};

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${apiBaseUrl}${path}`, {
		...init,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...(init?.headers ?? {}),
		},
	});

	if (response.status === 401) {
		throw Object.assign(new Error("Unauthorized"), { code: 401 });
	}

	if (!response.ok) {
		const message = await response.text();
		throw new Error(message || `Request failed with status ${response.status}`);
	}

	return (await response.json()) as T;
}

export default function HubPage() {
	const [session, setSession] = useState<SessionUser | null>(null);
	const [status, setStatus] = useState<Status>(null);
	const [checkingSession, setCheckingSession] = useState(true);
	const [isSubmitting, setSubmitting] = useState(false);
	const [form, setForm] = useState(() => ({ ...otpDefaults }));

	const updateStatus = useCallback((next: Status) => {
		setStatus(next);
		if (next) {
			setTimeout(() => setStatus(null), 5000);
		}
	}, []);

	const getSession = useCallback(async () => {
		try {
			const sessionUser = await fetchJson<SessionUser>("/api/session/me", {
				method: "GET",
				headers: {
					Accept: "application/json",
				},
			});
			setSession(sessionUser);
		} catch (error) {
			if ((error as { code?: number }).code === 401) {
				setSession(null);
			} else {
				console.error("Failed to retrieve session", error);
				updateStatus({
					type: "error",
					message:
						"Unable to contact the backend. Ensure https://localhost:7100 is running and the dev certificate is trusted.",
				});
			}
		} finally {
			setCheckingSession(false);
		}
	}, [updateStatus]);

	useEffect(() => {
		void getSession();
	}, [getSession]);

	const handleLogin = useCallback(
		async (event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			setSubmitting(true);
			updateStatus(null);

			try {
				const result = await fetchJson<{ user: SessionUser; message: string }>(
					"/api/authentication/login/otp",
					{
						method: "POST",
						body: JSON.stringify(form),
					},
				);

				setSession(result.user);
				updateStatus({ type: "success", message: result.message });
			} catch (error) {
				console.error("OTP login failed", error);
				updateStatus({
					type: "error",
					message:
						error instanceof Error
							? error.message
							: "Unable to sign in with the OTP. Check the console for details.",
				});
			} finally {
				setSubmitting(false);
			}
		},
		[form, updateStatus],
	);

	const handleLogout = useCallback(async () => {
		updateStatus(null);
		try {
			await fetchJson<{ message: string }>("/api/authentication/logout", {
				method: "POST",
			});
			setSession(null);
			updateStatus({ type: "success", message: "Session cleared." });
		} catch (error) {
			console.error("Failed to log out", error);
			updateStatus({
				type: "error",
				message:
					error instanceof Error
						? error.message
						: "Unable to clear the session.",
			});
		}
	}, [updateStatus]);

	const sessionDetails = useMemo(() => {
		if (!session) {
			return null;
		}

		return [
			{ label: "User", value: session.id },
			{ label: "Name", value: session.name },
			{ label: "Role", value: session.role },
			{ label: "Phone", value: session.phoneNumber ?? "—" },
			{ label: "Email", value: session.email ?? "—" },
		];
	}, [session]);

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
				<header className="space-y-2 text-center">
					<p className="text-sm uppercase tracking-[0.35em] text-slate-400">
						Multi Workspace
					</p>
					<h1 className="text-3xl font-semibold text-white sm:text-4xl">
						Next.js Hub
					</h1>
					<p className="text-sm text-slate-400 sm:text-base">
						Sign in against the .NET backend using the OTP demo, then jump into
						the Angular applications without re-entering credentials.
					</p>
				</header>

				{status && (
					<div
						className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${
							status.type === "success"
								? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
								: "border-rose-500/30 bg-rose-500/10 text-rose-200"
						}`}
					>
						{status.message}
					</div>
				)}

				<section className="grid gap-8 md:grid-cols-2">
					<div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/30">
						<h2 className="text-lg font-medium text-white">OTP sign-in</h2>
						<p className="mt-2 text-sm text-slate-400">
							Use the demo phone/OTP values to mint the session cookie from the
							backend.
						</p>

						<form className="mt-6 space-y-4" onSubmit={handleLogin}>
							<label className="block space-y-2 text-sm">
								<span className="font-medium text-slate-200">Phone number</span>
								<input
									name="phoneNumber"
									type="tel"
									autoComplete="tel"
									value={form.phoneNumber}
									onChange={(event) =>
										setForm((prev) => ({
											...prev,
											phoneNumber: event.target.value,
										}))
									}
									className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-base text-white shadow-inner shadow-slate-950/20 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
									placeholder="e.g. 5551234567"
									required
								/>
							</label>

							<label className="block space-y-2 text-sm">
								<span className="font-medium text-slate-200">
									One-time passcode
								</span>
								<input
									name="otp"
									type="text"
									inputMode="numeric"
									value={form.otp}
									onChange={(event) =>
										setForm((prev) => ({
											...prev,
											otp: event.target.value,
										}))
									}
									className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-base text-white shadow-inner shadow-slate-950/20 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
									placeholder="e.g. 246810"
									required
								/>
							</label>

							<button
								type="submit"
								className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-indigo-500/60"
								disabled={isSubmitting || session !== null}
							>
								{isSubmitting
									? "Signing in…"
									: session !== null
										? "Session active"
										: "Sign in"}
							</button>

							<div className="flex items-center justify-between text-xs text-slate-400">
								<button
									type="button"
									className="underline decoration-dotted underline-offset-4 transition hover:text-slate-200"
									onClick={() => setForm({ ...otpDefaults })}
								>
									Reset demo values
								</button>
							</div>
						</form>
					</div>

					<div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/30">
						<h2 className="text-lg font-medium text-white">Session status</h2>
						<div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
							{checkingSession ? (
								<p className="text-sm text-slate-400">Checking session…</p>
							) : session ? (
								<dl className="space-y-2 text-sm">
									{sessionDetails?.map((item) => (
										<div
											key={item.label}
											className="flex items-center justify-between gap-2 text-slate-300"
										>
											<dt className="font-medium text-slate-400">
												{item.label}
											</dt>
											<dd className="truncate text-right">{item.value}</dd>
										</div>
									))}
								</dl>
							) : (
								<p className="text-sm text-slate-400">
									No active session. Use the OTP form to authenticate.
								</p>
							)}
						</div>
						<button
							type="button"
							onClick={handleLogout}
							disabled={!session}
							className="mt-6 w-full rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-rose-400 hover:text-rose-200 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
						>
							Log out
						</button>
					</div>
				</section>

				<section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/30">
					<h2 className="text-lg font-medium text-white">
						Jump into the Angular apps
					</h2>
					<p className="mt-2 text-sm text-slate-400">
						These links open the standalone Angular apps. Because they share the
						session cookie, you stay authenticated during navigation.
					</p>

					<div className="mt-6 grid gap-4 sm:grid-cols-2">
						<a
							href={angularUserUrl}
							className="group rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-indigo-400 hover:bg-slate-900"
						>
							<h3 className="text-sm font-semibold text-indigo-300 group-hover:text-indigo-200">
								Resume application
							</h3>
							<p className="mt-2 text-xs text-slate-400">
								Opens the Angular user portal (`frontend-angular1`).
							</p>
						</a>

						<a
							href={angularAdminUrl}
							className="group rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-emerald-400 hover:bg-slate-900"
						>
							<h3 className="text-sm font-semibold text-emerald-300 group-hover:text-emerald-200">
								Admin dashboard
							</h3>
							<p className="mt-2 text-xs text-slate-400">
								Opens the Angular admin portal (`frontend-angular2`).
							</p>
						</a>
					</div>
				</section>
			</div>
		</div>
	);
}
