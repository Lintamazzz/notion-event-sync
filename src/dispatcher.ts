import { registerHandlers } from "./registry.js";
import { Handler } from "./types/handler.js";
import { NotionEvent } from "./types/notion.js";


const handlers: Handler[] = registerHandlers();

export default function dispatch(event: NotionEvent) {
    
    switch (event.type) {
        case "page.created":
        case "page.undeleted":
            handlers.forEach(handler => handler.handleCreate(event));
            break;
        case "page.deleted":    
            handlers.forEach(handler => handler.handleDelete(event));
            break;
        case "page.content_updated":
        case "page.properties_updated":
            handlers.forEach(handler => handler.handleUpdate(event));
            break;  
        default:
            console.log("unknown event");
    }
}