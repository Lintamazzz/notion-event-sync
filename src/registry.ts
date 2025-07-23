import { GoogleCalendarHandler } from "./platforms/google-calendar/handler.js";
import { Handler } from "./types/handler.js";
import "dotenv/config";

export function registerHandlers(): Handler[] {
	const handlers: Handler[] = [];

	if (enableGoogleCalendar()) {
		handlers.push(new GoogleCalendarHandler());
	}

	// Extend here: add more platforms if needed
	// if (enableOtherPlatform()) {
	//   handlers.push(new OtherPlatformHandler());
	// }

	return handlers;
}

function enableGoogleCalendar() {
	const hasGoogleConfig =
		process.env.GOOGLE_CALENDAR_CLIENT_ID &&
		process.env.GOOGLE_CALENDAR_CLIENT_SECRET &&
		process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
	return hasGoogleConfig;
}
