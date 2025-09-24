import { VercelRequest, VercelResponse } from "@vercel/node";
import dispatch from "../src/dispatcher.js";
import { NotionEvent, NotionEventSchema } from "../src/types/notion.js";

export default async (req: VercelRequest, res: VercelResponse) => {
	try {
		const startTime = Date.now();

		console.log("=========== Webhook Request ============");
		console.log("Time:", new Date().toISOString());
		console.log("URL:", req.url);
		console.log("Method:", req.method);
		console.log("Body:");
		console.log(JSON.stringify(req.body, null, 2));

		if (NotionEventSchema.safeParse(req.body).success) {
			await dispatch(req.body as NotionEvent);
		}

		const endTime = Date.now();
		console.log("Time taken: ", endTime - startTime, "ms");

		const name = req.query.name ?? "World";
		res.status(200).json({ msg: `Hello ${name}!` });
	} catch (e) {
		console.error(e);
		const message = e instanceof Error ? e.message : String(e);
		res.status(200).json({ msg: message });
	}
};
