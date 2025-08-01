import { VercelRequest, VercelResponse } from "@vercel/node";
import { Event } from "../../src/types/google-calendar.js";
import { deleteEventById, getEventById, isEventDeleted } from "../../src/platforms/google-calendar/client.js";

export default async (req: VercelRequest, res: VercelResponse) => {
	try {
		const id: string = req.query.id as string;
		await deleteEventById(id);

		res.json({
			time: new Date().toISOString(),
			delete_success: true,
		});
		// const event: Event = await getEventById(id);

		// let flag = false;
		// if (!isEventDeleted(event)) {
		//     await deleteEventById(id);
		//     flag = true;
		// }

		// res.json({
		//     time: new Date().toISOString(),
		//     isDeleted: isEventDeleted(event),
		//     doDelete: flag,
		//     event: event
		// })
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		res.status(500).json({ err_msg: message, error: e });
	}
};
