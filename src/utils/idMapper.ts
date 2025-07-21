/**
 * 
 * Map Notion Page ID to Google Calendar Event ID.  
 * When creating a new Google Calendar Event, you can specify its ID.  
 * 
 * notion page id uses UUID v4 -> See: https://developers.notion.com/reference/page  
 * google calendar id uses base32hex -> See: https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
 * 
 */
export function getEventIdFromPageId(pageId: string): string {
  return pageId?.replace(/-/g, '');
}