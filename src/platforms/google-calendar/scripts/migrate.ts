import { queryPages } from "../../notion/client.js";
import { PageObjectResponse } from "@notionhq/client";
import { GoogleCalendarHandler } from "../handler.js";

// npm install -g tsx
// tsx --env-file=.env src/platforms/google-calendar/scripts/migrate.ts

const startTime = Date.now();

const start = "2025-01-01";
const end = "2025-12-31";
const pages: PageObjectResponse[] = await queryPages({ start, end });

const handler = new GoogleCalendarHandler();
const results = [];
for (const page of pages) {
	try {
		await handler.handleCreate({
			entity: { id: page.id, type: "page" },
			id: "",
			timestamp: "",
			workspace_id: "",
			workspace_name: "",
			subscription_id: "",
			integration_id: "",
			authors: [],
			attempt_number: 0,
			type: "page.content_updated",
			data: {},
		});
		results.push({ pageId: page.id, status: "success" });
	} catch (error) {
		console.error(`Failed to handle page ${page.id}:`, error);
		results.push({
			pageId: page.id,
			status: "error",
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

const endTime = Date.now();
console.log("Sync completed");
console.log(`Total time: ${(endTime - startTime) / 1000} s`);
console.log("Summary: ", {
	total: pages.length,
	success: results.filter(r => r.status === "success").length,
	failed: results.filter(r => r.status === "error").length,
});
console.log(
	"Error pages:",
	results.filter(r => r.status === "error"),
);
