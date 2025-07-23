import { PageObjectResponse } from "@notionhq/client";
import { Event } from "../types/google-calendar.js";
import { z } from "zod";

/**
 * 
 * Map Notion Page ID to Google Calendar Event ID.  
 * When creating a new Google Calendar Event, you can specify its ID.  
 * 
 * notion page id uses UUID v4 -> See: https://developers.notion.com/reference/page  
 * google calendar id uses base32hex -> See: https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
 * 
 * Notice: Once a calendar event is permanently deleted (i.e. removed from the trash), it cannot be restored or updated, and its ID cannot be reused to create a new event.
 * In this case, the mapping between the Notion page ID and the Google Calendar event ID will be permanently broken. The solution is to recreate an identical Notion page, so you can use the new page ID to create the event again.
 * 
 */
export function getEventIdFromPageId(pageId: string): string {
	return pageId?.replace(/-/g, '');
}

/**
 * 
 * @param page - Notion Page Object
 * @returns Google Calendar Event Object
 */
export function pageToEvent(page: PageObjectResponse): Event {
	let title: string | undefined;
	let date: any;

	for (const prop of Object.values(page.properties)) {
        if (prop.type === 'title') {
            title = prop.title.length > 0 ? prop.title.map(t => t.plain_text).join('') : undefined;
        }
        if (prop.type === 'date') {
            date = prop.date;
        }
    }

	if (!date || !date.start) {
		throw new Error(`Page ${page.id} missing required date information`);
	}

	const start = getEventDateFromPageDate(date.start);
	const end = getEventDateFromPageDate(date.end || date.start);
	// "YYYY-mm-dd" means All-Day-Event
	// It uses [start, end), not [start, end]. So we should add 1 day to end time.
	if (end?.date != undefined) {
		const date = new Date(end.date);
		date.setDate(date.getDate() + 1);
		end.date = date.toISOString().split('T')[0];
	}

	return {
		id: getEventIdFromPageId(page.id),
		summary: title,
		description: page.public_url as string,
		start: start,
		end: end,
	}
}

export function getEventDateFromPageDate(dateString: string) {
	if (!dateString) return undefined;

	// if time format is "YYYY-mm-dd"
    const dateSchema = z.string().date();
    if (dateSchema.safeParse(dateString).success) {
        return { date: dateString };
    }

    // if time format is ISO 8601: "YYYY-mm-ddThh:mm:ssZ" or "YYYY-mm-ddThh:mm:ss+hh:mm"
    const datetimeSchema = z.string().datetime({ offset: true });
    if (datetimeSchema.safeParse(dateString).success) {
        return { dateTime: dateString };
    }
    
    throw new Error(`Invalid date format: ${dateString}`);
}