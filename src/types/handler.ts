import { NotionEvent } from "./notion.js";

export interface Handler {
	shouldHandle(event: NotionEvent): boolean;
	handleCreate(event: NotionEvent): void;
	handleUpdate(event: NotionEvent): void;
	handleDelete(event: NotionEvent): void;
}
