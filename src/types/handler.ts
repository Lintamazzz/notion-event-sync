import { NotionEvent } from "./notion.js"

export interface Handler {
    handleCreate(event: NotionEvent): void
    handleUpdate(event: NotionEvent): void
    handleDelete(event: NotionEvent): void
}