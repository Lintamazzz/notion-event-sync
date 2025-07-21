import { google } from "googleapis"
import { Event } from "../../types/google-calendar.js"
import { z } from "zod"
import "dotenv/config"


// set up a google calendar client
const oAuth2Client = new google.auth.OAuth2({
    client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID,
    client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    credentials: {
        refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
        access_token: getAccessToken(),
    }
})
const calendar = google.calendar({ version: "v3", auth: oAuth2Client })



// listen for access_token changes (old access_token expires, and new access_token is generated using refresh_token) 
oAuth2Client.on('tokens', (tokens) => {
    console.log(tokens)
})
function getAccessToken() {
    const token = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN
    return token;
}


// time format validation
const iso = z.string().datetime({ offset: true });







/**
 * @param eventId - required
 * @throws {Error} - if event is not found
 */
export async function getEventById(eventId: string): Promise<Event> {
    const result = await calendar.events.get({
        calendarId: "primary",
        eventId: eventId
    })
    return result.data as Event;
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
 * @throws {Error} - if event is not found or event has already been deleted
 */
export async function deleteEventById(eventId: string): Promise<void> {
    await calendar.events.delete({
        calendarId: "primary",
        eventId: eventId
    })
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
 * @param event.start - required
 * @param event.end - required 
 * @param event.summary - optional
 * @param event.description - optional
 * @throws {Error} - if time format is invalid or missing required fields or start time is after end time
 */
export async function insertEvent(event: Event): Promise<Event> {
    const result = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event
    })
    return result.data as Event;
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
        requestBody: event
    })
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
export async function listEvents({ timeMin, timeMax }: { timeMin?: string, timeMax?: string } = {}): Promise<Event[]> {
    let options: any = {
        calendarId: 'primary',
        singleEvents: true,
        orderBy: 'startTime',
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
