import { Client, PageObjectResponse } from "@notionhq/client";
import { QueryDatabaseResponse } from "@notionhq/client/build/src/api-endpoints.js";
import { z } from "zod";
import "dotenv/config";

const notion = new Client({
	auth: process.env.NOTION_TOKEN,
	notionVersion: "2022-06-28",
});
const databaseId = process.env.DATABASE_ID;
const datePropertyName = process.env.DATE_PROPERTY_NAME;

// time format validation for "YYYY-mm-dd"
const date = z.string().date();

/**
 *
 * @param pageId - required
 * @throws {Error} - if page is not found
 */
export async function getPage(pageId: string): Promise<PageObjectResponse> {
	const page = await notion.pages.retrieve({ page_id: pageId });
	return page as PageObjectResponse;
}

/**
 *
 * @param start - optional - "2025-01-01"
 * @param end - optional - "2025-12-31"
 * @throws {Error} - if databaseId or datePropertyName is undefined
 * @throws {Error} - if start or end is not a valid date
 */
export async function queryPages({ start, end }: { start?: string; end?: string }): Promise<PageObjectResponse[]> {
	if (!databaseId) {
		throw new Error("databaseId is undefined");
	}
	if (!datePropertyName) {
		throw new Error("datePropertyName is undefined");
	}

	let filter: any = { and: [] };
	if (start) {
		filter["and"].push({
			property: datePropertyName,
			date: { on_or_after: start },
		});
		if (!date.safeParse(start)) {
			throw new Error("start is not a valid date");
		}
	}
	if (end) {
		filter["and"].push({
			property: datePropertyName,
			date: { on_or_before: end },
		});
		if (!date.safeParse(end)) {
			throw new Error("end is not a valid date");
		}
	}

	let pages: PageObjectResponse[] = [];
	let cursor = null;

	do {
		const res: QueryDatabaseResponse = await notion.databases.query({
			database_id: databaseId,
			sorts: [
				{
					property: datePropertyName,
					direction: "ascending",
				},
			],
			filter: filter,
			start_cursor: cursor || undefined,
		});
		pages.push(...(res.results as PageObjectResponse[]));
		cursor = res.next_cursor;
	} while (cursor);

	return pages;
}
