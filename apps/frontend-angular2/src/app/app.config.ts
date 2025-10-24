import { provideHttpClient, withFetch } from "@angular/common/http";
import {
	type ApplicationConfig,
	provideBrowserGlobalErrorListeners,
	provideZoneChangeDetection,
} from "@angular/core";

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideHttpClient(withFetch()),
	],
};
