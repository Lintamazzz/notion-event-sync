import { cache } from "./cache.js";
import { getDatabaseProperties } from "../platforms/notion/client.js";
import { NotionEvent } from "../types/notion.js";
import { Event } from "../types/google-calendar.js";
import { getCalendarIdByYear, getEventIdFromPageId, getAllCalendarIds } from "./mapper.js";
import { getEventById, deleteEventById } from "../platforms/google-calendar/client.js";

/**
 * Check if the date property was modified in the webhook event
 * @param event - Notion webhook event
 * @returns Promise<boolean> - true if date property was modified
 */
export async function isDatePropertyModified(event: NotionEvent): Promise<boolean> {
	if (event.type !== "page.properties_updated") {
		return false;
	}
	
	const databaseId = event.data.parent?.id?.replace(/-/g, "");
	if (!databaseId) {
		console.log("Database ID not found in event, skipping date property check");
		return false;
	}

	// Get or fetch database properties
	const properties = await getDatabasePropertiesWithCache(databaseId);
	
	// Get date property ID
	const datePropertyId = properties[process.env.DATE_PROPERTY_NAME || ""];
	if (!datePropertyId) {
		console.log(`Date property "${process.env.DATE_PROPERTY_NAME}" not found in database`);
		return false;
	}

	// Check if date property is in updated_properties
	return event.data.updated_properties?.includes(datePropertyId) || false;
}

/**
 * Get database properties with Redis caching
 * @param databaseId - database ID
 * @returns Promise<Record<string, string>> - property name to property id mapping
 */
async function getDatabasePropertiesWithCache(databaseId: string): Promise<Record<string, string>> {
	const cacheKey = `database_properties:${databaseId}`;
	
	// Try to get from cache first
	const cached = await cache.get(cacheKey);
	if (cached) {
		try {
			return JSON.parse(cached);
		} catch (e) {
			console.log("Failed to parse cached database properties, fetching fresh data");
		}
	}

	// Fetch fresh data
	const propertiesMap = await getDatabaseProperties(databaseId);
	
	// Cache for 7 days
	const serialized = JSON.stringify(propertiesMap);
	await cache.setex(cacheKey, serialized, { ex: 7 * 24 * 60 * 60 });
	
	return propertiesMap;
}

/**
 * Clean up duplicate events in other calendars when date property is modified
 * 
 * Why?
 * 1. Notion page created with datae "2026-01-14" -> handleCreate -> getCalendarIdByYear -> create in 2026 calendar
 * 2. Date property updated to "2025-11-22" -> handleUpdate -> getCalendarIdByYear -> update in 2025 calendar -> not found -> create in 2025 calendar
 * 3. So the change of year in date property results in duplicate events.
 * 
 * 
 * @param pageId - Notion page ID
 * @param newEvent - New event data after update
 * @returns Promise<void>
 */
export async function cleanupDuplicateEvents(pageId: string, newEvent: Event): Promise<void> {
	const eventId = getEventIdFromPageId(pageId);
	const DEFAULT_CALENDAR_ID = process.env.GOOGLE_CALENDAR_DEFAULT_ID || "primary";
	const newCalendarId = getCalendarIdByYear(newEvent) || DEFAULT_CALENDAR_ID;
	
	// Get all possible calendar IDs from environment mapping
	const calendarIds = getAllCalendarIds();
	
	// Add default calendar if it's not in the mapping
	if (!calendarIds.includes(DEFAULT_CALENDAR_ID)) {
		calendarIds.push(DEFAULT_CALENDAR_ID);
	}
	
	// Check all other calendars for the same event
	for (const calendarId of calendarIds) {
		if (calendarId === newCalendarId) {
			continue; // Skip the target calendar
		}

		try {
			const existingEvent = await getEventById(eventId, calendarId);
			if (existingEvent) {
				console.log(`Found duplicate event in calendar ${calendarId}, deleting it`);
				await deleteEventById(eventId, calendarId);
				console.log(`Successfully deleted duplicate event from calendar ${calendarId}`);
			}
		} catch (error) {
			console.log(`Error checking/deleting event in calendar ${calendarId}:`, error);
		}
	}
}
