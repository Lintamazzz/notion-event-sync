import { VercelRequest, VercelResponse } from "@vercel/node";
import { queryPages } from "../../src/platforms/notion/client.js";

export default async (req: VercelRequest, res: VercelResponse) => {
	try {
		const start = req.query.start as string;
		const end = req.query.end as string;
		const pages = await queryPages({ start, end });

		let pageInfos = [];
		for (const page of pages) {
			let title, date;
			for (const prop of Object.values(page.properties)) {
				if (prop.type === "title") {
					title = prop.title.length > 0 ? prop.title.map(t => t.plain_text).join("") : undefined;
				}
				if (prop.type === "date") {
					date = prop.date;
				}
			}
			pageInfos.push({
				id: page.id,
				deleted: page.in_trash,
				url: page.public_url,
				title: title,
				date: date,
			});
		}

		res.json({
			time: new Date().toISOString(),
			pageInfos: pageInfos,
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		res.status(500).json({ err_msg: message });
	}
};
