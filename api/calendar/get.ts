import { VercelRequest, VercelResponse } from "@vercel/node";
import { getEventById, isEventDeleted } from "../../src/platforms/google-calendar/client.js";

export default async (req: VercelRequest, res: VercelResponse) => {
	try {
		const id: string = req.query.id as string;
		const calendarId = req.query.calendarId as string;
		const event = await getEventById(id, calendarId || undefined);

		if (!event) {
			res.status(500).json({ err_msg: `Event ${id} not found in calendar` });
			return;
		}

		res.json({
			time: new Date().toISOString(),
			isDeleted: isEventDeleted(event),
			event: event,
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		res.status(500).json({ err_msg: message, error: e });
	}
};
