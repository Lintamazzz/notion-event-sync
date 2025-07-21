import { z } from 'zod';

// See: https://developers.notion.com/reference/webhooks-events-delivery
export interface NotionEvent {
  id: string;
  timestamp: string;
  workspace_id: string;
  workspace_name: string;
  subscription_id: string;
  integration_id: string;
  authors: Author[];
  attempt_number: number;
  entity: Entity;
  type: EventType;
  data: Object;
}

export const NotionEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  workspace_id: z.string(),
  workspace_name: z.string(),
  subscription_id: z.string(),
  integration_id: z.string(),
  attempt_number: z.number(),
  type: z.string(),
});


export interface Author {
  id: string;
  type: "person" | "bot" | "agent";
}

export interface Entity {
  id: string;
  type: "page" | "database" | "block";
}

export type EventType = PageEventType | DatabaseEventType | CommentEventType;

export type PageEventType =
  | "page.content_updated"
  | "page.created"
  | "page.deleted"
  | "page.locked"
  | "page.moved"
  | "page.properties_updated"
  | "page.undeleted"
  | "page.unlocked";

export type DatabaseEventType =
  | "database.content_updated"
  | "database.created"
  | "database.deleted"
  | "database.moved"
  | "database.schema_updated"
  | "database.undeleted";

export type CommentEventType =
  | "comment.created"
  | "comment.deleted"
  | "comment.updated";

