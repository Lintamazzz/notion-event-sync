import { registerHandlers } from "./registry.js";
import { Handler } from "./types/handler.js";
import { NotionEvent } from "./types/notion.js";

const handlers: Handler[] = registerHandlers();

export default async function dispatch(event: NotionEvent) {
	const filteredHandlers = handlers.filter(handler => handler.shouldHandle(event));

	switch (event.type) {
		case "page.created":
		case "page.undeleted":
			await Promise.all(filteredHandlers.map(handler => handler.handleCreate(event)));
			break;
		case "page.deleted":
			await Promise.all(filteredHandlers.map(handler => handler.handleDelete(event)));
			break;
		case "page.content_updated":
		case "page.properties_updated":
			await Promise.all(filteredHandlers.map(handler => handler.handleUpdate(event)));
			break;
		default:
			console.log("unknown event");
	}
}
