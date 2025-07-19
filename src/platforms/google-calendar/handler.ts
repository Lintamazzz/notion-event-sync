import { Handler } from "../../types/handler.js";
import { NotionEvent } from "../../types/notion.js";

export class GoogleCalendarHandler implements Handler {
    // only need to 
    handleCreate(event: NotionEvent): void {
        // throw new Error("Method not implemented.");
        console.log("GoogleCalendarHandler: page.created");
    }
    handleUpdate(event: NotionEvent) {
        console.log("GoogleCalendarHandler: page.updated");
    }
    handleDelete(event: NotionEvent): void {
        console.log("GoogleCalendarHandler: page.deleted");
    } 
    
}