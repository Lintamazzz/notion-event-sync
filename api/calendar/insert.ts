import { VercelRequest, VercelResponse } from "@vercel/node";
import { insertEvent } from "../../src/platforms/google-calendar/client.js";
import { getEventIdFromPageId } from "../../src/utils/mapper.js";

export default async (req: VercelRequest, res: VercelResponse) => {
	try {
		const id = req.query.id as string;
		const start = req.query.start as string;
		const end = req.query.end as string;
		const summary = req.query.title as string;
		const description = req.query.desc as string;

		const event = await insertEvent({
			id: getEventIdFromPageId(id),
			start: { dateTime: start },
			end: { dateTime: end },
			summary,
			description,
		});

		if (!event) {
			res.status(500).json({ err_msg: `Event ${id} already exists` });
			return;
		}

		res.json({
			time: new Date().toISOString(),
			event: event,
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		res.status(500).json({ err_msg: message, error: e });
	}
};
