import { google } from "googleapis";
import { Event } from "../../types/google-calendar.js";
import { z } from "zod";
import "dotenv/config";
import { cache } from "../../utils/cache.js";

// ==============  Setup a Google Calendar client  =====================
const ACCESS_TOKEN_KEY = "accessToken";
const LOCK_KEY = "accessToken:lock";
const MAX_RETRY = 5;
const RETRY_INTERVAL_MS = 1000;

// Access token
let token: string | undefined = undefined;

// Attempt to get access_token from Redis cache (to reuse the access_token)
const cached = await cache.get(ACCESS_TOKEN_KEY);

if (cached) {
	// Token exists in Redis, use it directly
	token = cached;
	console.log("Get access_token from cache");
} else {
	// No token in cache, attempt to acquire lock to refresh token
	const locked = await cache.tryLock(LOCK_KEY, 30);

	if (locked) {
		// Use the undefined token directly, it will automatically refresh the token
		console.log("Lock success, refresh the access_token");
	} else {
		// Lock not acquired: retry until someone else refreshes and sets the token
		for (let i = 0; i < MAX_RETRY; i++) {
			await delay(RETRY_INTERVAL_MS);

			const cachedRetry = await cache.get(ACCESS_TOKEN_KEY);
			if (cachedRetry) {
				token = cachedRetry;
				console.log("Get access_token from cache, retry cnt:", i + 1);
				break;
			}
		}
	}
}

const oAuth2Client = new google.auth.OAuth2({
	client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID,
	client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
	credentials: {
		refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
		access_token: token,
	},
});
const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

// listen for access_token changes (old access_token expires, and new access_token is generated using refresh_token)
oAuth2Client.on("tokens", tokens => {
	console.log(tokens);
	cache.setex(ACCESS_TOKEN_KEY, tokens.access_token as string, {
		pxat: tokens.expiry_date,
	});
	cache.unLock(LOCK_KEY);
});

function delay(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// time format validation for ISO 8601
const iso = z.string().datetime({ offset: true });

// =====================  API  =========================
// Error Code See: https://developers.google.com/workspace/calendar/api/guides/errors

/**
 * return null if event is not found
 * @param eventId - required
 */
export async function getEventById(eventId: string): Promise<Event | null> {
	try {
		const result = await calendar.events.get({
			calendarId: "primary",
			eventId: eventId,
		});
		return result.data as Event;
	} catch (err: any) {
		if (err.code === 404) {
			console.error(`Event ${eventId} not found in calendar`);
			return null;
		}
		throw err;
	}
}

/**
 * check whether event is deleted
 * - event.status === "cancelled" -> deleted
 * - event.status === "confirmed" -> not deleted
 */
export function isEventDeleted(event: Event): boolean {
	return event?.status === "cancelled";
}

/**
 * @param eventId - required
 */
export async function deleteEventById(eventId: string): Promise<void> {
	try {
		await calendar.events.delete({
			calendarId: "primary",
			eventId: eventId,
		});
	} catch (err: any) {
		if (err.code === 410) {
			console.error(`Event ${eventId} has already been deleted`);
			return;
		}
		if (err.code === 404) {
			console.error(`Event ${eventId} not found in calendar`);
			return;
		}
		throw err;
	}
}

/**
 * Example input:
 * ```ts
 * {
 *   start: { dateTime: '2025-07-23T00:00:00+08:00', timeZone: 'Asia/Shanghai' },
 *   end:   { dateTime: '2025-07-23T20:30:00+08:00', timeZone: 'Asia/Shanghai' },
 *   summary:     'event title',
 *   description: 'event details',
 * }
 * ```
 * All-day-event:
 * ```ts
 * {
 *   start: { date: '2025-07-23'},
 *   end:   { date: '2025-07-23'},
 * }
 * ```
 *
 * @param event.id - optional - When creating a new Google Calendar Event, you can specify its ID. See: https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
 * @param event.start - required
 * @param event.end - required
 * @param event.summary - optional
 * @param event.description - optional
 * @throws {Error} - if time format is invalid or missing required fields or start time is after end time
 */
export async function insertEvent(event: Event): Promise<Event | null> {
	try {
		const result = await calendar.events.insert({
			calendarId: "primary",
			requestBody: event,
		});
		return result.data as Event;
	} catch (err: any) {
		if (err.code === 409) {
			console.error(`Event ID ${event.id} already exists, assuming it was inserted by another request.`);
			return null; // Alternatively, you can retrieve and return the existing event using getEventById(event.id).
		}
		throw err;
	}
}

/**
 * Example input:
 * ```ts
 * {
 *   start: { dateTime: '2025-07-23T00:00:00+08:00', timeZone: 'Asia/Shanghai' },
 *   end:   { dateTime: '2025-07-23T20:30:00+08:00', timeZone: 'Asia/Shanghai' },
 *   summary:     'event title',
 *   description: 'event details',
 * }
 * ```
 * All-day-event:
 * ```ts
 * {
 *   start: { date: '2025-07-23'},
 *   end:   { date: '2025-07-23'},
 * }
 * ```
 * @param event.id - required
 * @param event.start - required
 * @param event.end - required
 * @param event.summary - optional
 * @param event.description - optional
 * @throws {Error} - if time format is invalid or missing required fields or start time is after end time
 */
export async function updateEvent(event: Event): Promise<Event> {
	const result = await calendar.events.update({
		calendarId: "primary",
		eventId: event.id,
		requestBody: event,
	});
	return result.data as Event;
}

/**
 * An event is returned only when (startTime, endTime) intersects with (timeMin, timeMax)
 * Lower bound and Upper bound are both exclusive
 * All-day-event = (00:00:00 of today, 00:00:00 of next day)
 *
 * @param timeMin - optional
 * @param timeMax - optional
 * @throws {Error} - if time format is invalid or timeMin is after timeMax
 */
export async function listEvents({ timeMin, timeMax }: { timeMin?: string; timeMax?: string } = {}): Promise<Event[]> {
	let options: any = {
		calendarId: "primary",
		singleEvents: true,
		orderBy: "startTime",
	};

	if (timeMin) {
		if (!iso.safeParse(timeMin).success) {
			throw new Error(`timeMin is not a valid ISO time string: ${timeMin}`);
		}
		options.timeMin = timeMin;
	}

	if (timeMax) {
		if (!iso.safeParse(timeMax).success) {
			throw new Error(`timeMax is not a valid ISO time string: ${timeMax}`);
		}
		options.timeMax = timeMax;
	}

	if (timeMin && timeMax && new Date(timeMin) > new Date(timeMax)) {
		throw new Error("timeMin must be <= timeMax");
	}

	const result = await calendar.events.list(options);
	return result.data.items as Event[];
}
