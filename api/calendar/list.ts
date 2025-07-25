import { VercelRequest, VercelResponse } from "@vercel/node";
import { Event } from "../../src/types/google-calendar.js";
import { listEvents } from "../../src/platforms/google-calendar/client.js";

export default async (req: VercelRequest, res: VercelResponse) => {
	try {
		const timeMin = req.query.start as string;
		const timeMax = req.query.end as string;
		const calendarId = req.query.calendarId as string;
		const events: Event[] = await listEvents(calendarId || undefined, { timeMin, timeMax });

		res.json({
			time: new Date().toISOString(),
			events: events,
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		res.status(500).json({ err_msg: message });
	}
};
