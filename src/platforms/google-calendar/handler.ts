import { PageObjectResponse } from "@notionhq/client";
import { Handler } from "../../types/handler.js";
import { NotionEvent } from "../../types/notion.js";
import { getPage } from "../notion/client.js";
import { getEventIdFromPageId, pageToEvent } from "../../utils/mapper.js";
import { Event } from "../../types/google-calendar.js";
import { deleteEventById, getEventById, insertEvent, updateEvent } from "./client.js";


// See: https://developers.notion.com/reference/webhooks-events-delivery#event-delivery
export class GoogleCalendarHandler implements Handler {

    async handleCreate(event: NotionEvent): Promise<void> {
        // 1. Get Notion Page ID
        const pageId = event.entity.id;
        console.log(`GoogleCalendarHandler: handling create for page ${pageId}`);

        // 2. Confirm that Notion Page is not in trash
        const page: PageObjectResponse = await getPage(pageId);
        if (page.in_trash) {
            console.log(`Page ${pageId} is in trash, skipping sync`);
            return;
        }

        // 3. Map Notion Page Info to Google Calendar Event
        const e: Event = pageToEvent(page);
        console.log(e)

        // 4. Sync to Calendar
        const exist = await getEventById(e.id as string);
        if (!exist) {
            await insertEvent(e);
        } else {
            e.status = 'confirmed'; // undelete if event is deleted
            await updateEvent(e);
        }
        
        console.log(`Successfully synced page ${pageId} to calendar`);
    }

    async handleUpdate(event: NotionEvent): Promise<void> {
        // 1. Get Notion Page ID
        const pageId = event.entity.id;
        console.log(`GoogleCalendarHandler: handling update for page ${pageId}`);

        // 2. Fetch the Latest Page Data
        const page: PageObjectResponse = await getPage(pageId);
        if (page.in_trash) {
            console.log(`Page ${pageId} is in trash, skipping sync`);
            return;
        }

        // 3. Map Notion Page Info to Google Calendar Event
        const e: Event = pageToEvent(page);
        console.log(e)

        // 4. Sync to Calendar
        const exist = await getEventById(e.id as string);
        if (exist) {
            e.status = 'confirmed'; // undelete if event is deleted
            await updateEvent(e);
        } else {
            await insertEvent(e);
        }
        
        console.log(`Successfully synced page ${pageId} to calendar`);
    }

    async handleDelete(event: NotionEvent): Promise<void> {
        // 1. Get Notion Page ID
        const pageId = event.entity.id;
        console.log(`GoogleCalendarHandler: handling delete for page ${pageId}`);

        // 2. Confirm that Notion Page is really in trash
        const page: PageObjectResponse = await getPage(pageId);
        if (!page.in_trash) {
            console.log(`Page ${pageId} is not in trash, skipping sync`);
            return;
        }

        // 3. Sync to Calendar
        await deleteEventById(getEventIdFromPageId(pageId));
        
        console.log(`Successfully synced page ${pageId} to calendar`);
    }

}